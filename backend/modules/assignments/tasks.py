"""
Periodic background task: mark assignments as Overdue.

Called once per loop iteration in run_push_notification_worker
(backend/modules/push/tasks.py) so it shares the same 15-minute cadence
without spinning up a second asyncio task.
"""
import logging

import asyncpg
from database import get_pool

logger = logging.getLogger(__name__)


async def mark_overdue_assignments(pool: asyncpg.Pool) -> None:
    """
    Transition any active assignment whose deadline has passed (and whose
    current status is still 'Not started' or 'In progress') to 'Overdue'.

    For each transition:
      - Captures the previous_status and tenant_id before the UPDATE.
      - Inserts a row into assignment_status_log with the correct tenant_id
        (denormalized from the assignments row — matching the pattern used
        in queries.update_assignment_status so the log table is always
        consistent with the primary table's tenant ownership).

    The UPDATE itself runs across all tenants at once: transitioning every
    expired assignment to Overdue is a safe blanket operation that doesn't
    require tenant scoping (it reads no data, only advances status).
    The status_log INSERT, however, carries the correct per-row tenant_id.

    All work for one assignment runs in a single transaction so the log row
    and the status update are always consistent.
    """
    async with pool.acquire() as conn:
        # Fetch every assignment that needs to flip to Overdue.
        # We lock the rows (FOR UPDATE) so a concurrent request can't
        # race us and produce a duplicate log entry.
        # tenant_id is included so it can be denormalized into the log row.
        candidates = await conn.fetch(
            """
            SELECT id, tenant_id, status AS previous_status
            FROM   assignments
            WHERE  is_active = TRUE
              AND  status IN ('Not started', 'In progress')
              AND  deadline < NOW()
            FOR UPDATE
            """
        )

        if not candidates:
            return

        for row in candidates:
            assignment_id   = row["id"]
            tenant_id       = row["tenant_id"]
            previous_status = row["previous_status"]

            async with conn.transaction():
                await conn.execute(
                    """
                    UPDATE assignments
                    SET    status     = 'Overdue',
                           updated_at = NOW()
                    WHERE  id = $1
                    """,
                    assignment_id,
                )
                # Denormalize tenant_id into the log so RLS on assignment_status_log
                # can evaluate it without a JOIN back to assignments.
                await conn.execute(
                    """
                    INSERT INTO assignment_status_log
                        (assignment_id, tenant_id, previous_status, new_status)
                    VALUES ($1, $2, $3, 'Overdue')
                    """,
                    assignment_id,
                    tenant_id,
                    previous_status,
                )

        logger.info(
            "mark_overdue_assignments: transitioned %d assignment(s) to Overdue",
            len(candidates),
        )
