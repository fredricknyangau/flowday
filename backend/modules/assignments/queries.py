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
    a.context_id,
    c.name        AS context_name,
    c.priority    AS context_priority,
    c.context_type AS context_type,
    a.assignment_type,
    a.course,
    a.word_count,
    a.estimated_hours,
    a.deadline,
    a.status,
    a.payment_kes,
    a.notes,
    a.reminder_minutes_before,
    a.is_active,
    a.received_at,
    a.submitted_at,
    a.paid_at,
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
        LEFT JOIN contexts c ON c.id = a.context_id
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
    return await conn.fetch(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
        WHERE  a.tenant_id = $1
          AND  a.is_active = TRUE
          AND  a.status != 'Cancelled'
          AND  (
                  (a.status != 'Submitted' AND ((a.deadline >= $2 AND a.deadline < $3) OR a.status = 'Overdue'))
               OR (a.status = 'Submitted' AND a.submitted_at >= $2 AND a.submitted_at < $3)
               OR (a.status = 'Submitted' AND a.payment_kes IS NOT NULL AND a.paid_at IS NULL)
               )
        ORDER  BY
          -- Overdue assignments surface first, followed by active pending, then submitted
          CASE WHEN a.status = 'Overdue' THEN 0 WHEN a.status = 'Submitted' THEN 2 ELSE 1 END,
          a.deadline ASC
        """,
        tenant_id,
        day_start,
        day_end,
    )


async def get_monthly_assignments(
    conn: asyncpg.Connection,
    month_start: datetime,
    month_end: datetime,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
        WHERE  a.tenant_id = $1
          AND  a.is_active = TRUE
          AND  (
                  (a.deadline >= $2 AND a.deadline < $3)
                  OR (a.submitted_at >= $2 AND a.submitted_at < $3)
               )
        ORDER  BY a.deadline ASC
        """,
        tenant_id,
        month_start,
        month_end,
    )


async def create_assignment(
    conn: asyncpg.Connection,
    data: CreateAssignmentRequest,
    tenant_id: UUID,
) -> asyncpg.Record:
    estimated_hours = (
        _ceil_to_half(data.word_count / 300) if data.word_count is not None else None
    )
    return await conn.fetchrow(
        f"""
        INSERT INTO assignments
            (tenant_id, context_id, assignment_type, course, word_count,
             estimated_hours, deadline, payment_kes, notes, reminder_minutes_before)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, context_id, assignment_type, course, word_count,
                  estimated_hours, deadline, status, payment_kes, notes,
                  reminder_minutes_before, is_active, received_at, submitted_at,
                  created_at, updated_at
        """,
        tenant_id,
        data.context_id,
        data.assignment_type,
        data.course,
        data.word_count,
        estimated_hours,
        data.deadline,
        data.payment_kes,
        data.notes,
        data.reminder_minutes_before,
    )


async def update_assignment_status(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    new_status: AssignmentStatus,
    tenant_id: UUID,
) -> asyncpg.Record | None:
    async with conn.transaction():
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

    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
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
    estimated_hours: Decimal | None = None
    if body.word_count is not None:
        estimated_hours = _ceil_to_half(body.word_count / 500.0)

    updated = await conn.fetchrow(
        f"""
        UPDATE assignments
        SET    context_id      = $1,
               assignment_type = $2,
               course          = $3,
               word_count      = $4,
               estimated_hours = $5,
               deadline        = $6,
               payment_kes     = $7,
               notes           = $8,
               reminder_minutes_before = $9,
               updated_at      = NOW()
        WHERE  id = $10 AND tenant_id = $11
        RETURNING id
        """,
        body.context_id,
        body.assignment_type,
        body.course,
        body.word_count,
        estimated_hours,
        body.deadline,
        body.payment_kes,
        body.notes,
        body.reminder_minutes_before,
        assignment_id,
        tenant_id,
    )

    if not updated:
        return None

    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
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


# ── PAYMENT MARKING ──────────────────────────────────────────────────────────

async def mark_assignment_paid(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    tenant_id: UUID,
    paid_at: datetime,
) -> asyncpg.Record | None:
    """
    Stamp paid_at on an assignment, confirming money has arrived.

    Rules:
    - Returns None → 404 if the assignment doesn't exist or belongs to another tenant.
    - Raises ValueError → 422 if payment_kes is NULL (marking paid is meaningless without an amount).
    - Does NOT require status = 'Submitted'; the caller may mark any non-cancelled
      assignment paid if the client pays in advance (edge case, but valid).
    - Does NOT touch submitted_at — that timestamp tracks delivery, not payment.
    """
    row = await conn.fetchrow(
        """
        SELECT payment_kes
        FROM   assignments
        WHERE  id = $1 AND tenant_id = $2 AND is_active = TRUE
        """,
        assignment_id,
        tenant_id,
    )
    if row is None:
        return None
    if row["payment_kes"] is None:
        raise ValueError("Cannot mark paid: this assignment has no payment amount set (payment_kes is null).")

    await conn.execute(
        """
        UPDATE assignments
        SET    paid_at    = $1,
               updated_at = NOW()
        WHERE  id = $2
        """,
        paid_at,
        assignment_id,
    )

    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
        WHERE  a.id = $1 AND a.tenant_id = $2
        """,
        assignment_id,
        tenant_id,
    )
