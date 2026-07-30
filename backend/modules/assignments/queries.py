from datetime import datetime
from uuid import UUID

import asyncpg

from modules.assignments.schemas import (
    AssignmentStatus,
    CreateAssignmentRequest,
    UpdateAssignmentRequest,
    _ceil_to_half,
)


_ASSIGNMENT_COLS = """
    a.id,
    a.client_id,
    c.name        AS client_name,
    c.priority    AS client_priority,
    a.assignment_type,
    a.course,
    a.word_count,
    a.estimated_hours,
    a.deadline,
    a.status,
    a.payment_kes,
    a.notes,
    a.is_active,
    a.received_at,
    a.submitted_at,
    a.created_at,
    a.updated_at
"""


async def get_all_assignments(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN clients c ON c.id = a.client_id
        WHERE  a.tenant_id = $1
          AND  a.is_active = TRUE
        ORDER  BY a.deadline ASC
        """,
        tenant_id,
    )


async def get_today_assignments(
    conn: asyncpg.Connection,
    day_start: datetime,
    day_end: datetime,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    """
    Returns active assignments whose deadline falls within [day_start, day_end),
    excluding statuses 'Submitted' and 'Cancelled', ordered by deadline ASC.
    day_start / day_end are UTC-aware datetimes computed by the router from the
    Africa/Nairobi 08:00 boundary.
    """
    return await conn.fetch(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN clients c ON c.id = a.client_id
        WHERE  a.tenant_id = $1
          AND  a.is_active = TRUE
          AND  a.deadline >= $2
          AND  a.deadline <  $3
          AND  a.status NOT IN ('Submitted', 'Cancelled')
        ORDER  BY a.deadline ASC
        """,
        tenant_id,
        day_start,
        day_end,
    )


async def create_assignment(
    conn: asyncpg.Connection,
    data: CreateAssignmentRequest,
    tenant_id: UUID,
) -> asyncpg.Record:
    # Compute estimated_hours here — not on the schema — so there is no
    # dependency on Pydantic dataclass-style Field kwargs (init=False).
    estimated_hours = (
        _ceil_to_half(data.word_count / 300) if data.word_count is not None else None
    )
    return await conn.fetchrow(
        f"""
        INSERT INTO assignments
            (tenant_id, client_id, assignment_type, course, word_count,
             estimated_hours, deadline, payment_kes, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, client_id, assignment_type, course, word_count,
                  estimated_hours, deadline, status, payment_kes, notes,
                  is_active, received_at, submitted_at, created_at, updated_at
        """,
        tenant_id,
        data.client_id,
        data.assignment_type,
        data.course,
        data.word_count,
        estimated_hours,
        data.deadline,
        data.payment_kes,
        data.notes,
    )


async def update_assignment_status(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    new_status: AssignmentStatus,
    tenant_id: UUID,
) -> asyncpg.Record | None:
    """
    Updates assignment status, sets submitted_at when status becomes 'Submitted',
    writes a row to assignment_status_log, and returns the updated assignment
    with client_name. Returns None if the assignment does not exist, is inactive,
    OR belongs to a different tenant — all three cases are deliberately collapsed
    into a single None return so the caller returns 404 without distinguishing
    between "doesn't exist" and "belongs to someone else."
    All operations run inside a single transaction.
    """
    async with conn.transaction():
        # Fetch current status — confirms row exists, is active, AND belongs to
        # this tenant. A single query, a single condition: no timing difference
        # between "not found" and "wrong tenant" that could leak information.
        current = await conn.fetchrow(
            """
            SELECT status
            FROM   assignments
            WHERE  id = $1
              AND  tenant_id = $2
              AND  is_active = TRUE
            """,
            assignment_id,
            tenant_id,
        )
        if current is None:
            return None

        previous_status: str = current["status"]

        # Update the assignment row.
        # Cast $1 to ::varchar explicitly to avoid PostgreSQL's
        # "inconsistent types deduced for parameter $1" when the same
        # placeholder appears in both SET (character varying) and CASE WHEN (text).
        await conn.execute(
            """
            UPDATE assignments
            SET    status       = $1::varchar,
                   submitted_at = CASE WHEN $1::varchar = 'Submitted' THEN NOW()
                                       ELSE submitted_at END,
                   updated_at   = NOW()
            WHERE  id = $2
            """,
            new_status,
            assignment_id,
        )

        # Write the status-change audit log.
        # tenant_id is denormalized here (not derived via JOIN) so RLS on this
        # table can evaluate it directly without a subquery.
        await conn.execute(
            """
            INSERT INTO assignment_status_log
                (assignment_id, tenant_id, previous_status, new_status)
            VALUES ($1, $2, $3, $4)
            """,
            assignment_id,
            tenant_id,
            previous_status,
            new_status,
        )

    # Re-fetch with client_name JOIN so the response shape is consistent.
    # tenant_id guard here is belt-and-suspenders — the row was already
    # confirmed as belonging to this tenant above.
    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN clients c ON c.id = a.client_id
        WHERE  a.id = $1
          AND  a.tenant_id = $2
        """,
        assignment_id,
        tenant_id,
    )


async def update_assignment(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    tenant_id: UUID,
    body: UpdateAssignmentRequest,
) -> asyncpg.Record | None:
    """
    Updates assignment fields and recalculates estimated_hours based on word_count.
    """
    estimated_hours: Decimal | None = None
    if body.word_count is not None:
        estimated_hours = _ceil_to_half(body.word_count / 500.0)

    updated = await conn.fetchrow(
        f"""
        UPDATE assignments
        SET    client_id       = $1,
               assignment_type = $2,
               course          = $3,
               word_count      = $4,
               estimated_hours = $5,
               deadline        = $6,
               payment_kes     = $7,
               notes           = $8,
               updated_at      = NOW()
        WHERE  id = $9 AND tenant_id = $10
        RETURNING id
        """,
        body.client_id,
        body.assignment_type,
        body.course,
        body.word_count,
        estimated_hours,
        body.deadline,
        body.payment_kes,
        body.notes,
        assignment_id,
        tenant_id,
    )

    if not updated:
        return None

    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN clients c ON c.id = a.client_id
        WHERE  a.id = $1 AND a.tenant_id = $2
        """,
        assignment_id,
        tenant_id,
    )


# ── SUBTASK QUERIES ──────────────────────────────────────────────────────────

async def get_subtasks(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT id, assignment_id, title, is_completed, created_at
        FROM   assignment_subtasks
        WHERE  assignment_id = $1 AND tenant_id = $2
        ORDER BY created_at ASC
        """,
        assignment_id,
        tenant_id,
    )


async def create_subtask(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    tenant_id: UUID,
    title: str,
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO assignment_subtasks (assignment_id, tenant_id, title)
        VALUES ($1, $2, $3)
        RETURNING id, assignment_id, title, is_completed, created_at
        """,
        assignment_id,
        tenant_id,
        title,
    )


async def toggle_subtask(
    conn: asyncpg.Connection,
    subtask_id: UUID,
    tenant_id: UUID,
    is_completed: bool,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        UPDATE assignment_subtasks
        SET    is_completed = $1, updated_at = NOW()
        WHERE  id = $2 AND tenant_id = $3
        RETURNING id, assignment_id, title, is_completed, created_at
        """,
        is_completed,
        subtask_id,
        tenant_id,
    )


async def delete_subtask(
    conn: asyncpg.Connection,
    subtask_id: UUID,
    tenant_id: UUID,
) -> bool:
    res = await conn.execute(
        """
        DELETE FROM assignment_subtasks
        WHERE id = $1 AND tenant_id = $2
        """,
        subtask_id,
        tenant_id,
    )
    return res.endswith("1")


