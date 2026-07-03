from datetime import datetime
from uuid import UUID

import asyncpg

from modules.assignments.schemas import CreateAssignmentRequest, AssignmentStatus


_ASSIGNMENT_COLS = """
    a.id,
    a.client_id,
    c.name        AS client_name,
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


async def get_all_assignments(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    return await conn.fetch(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        JOIN   clients c ON c.id = a.client_id
        WHERE  a.is_active = TRUE
        ORDER  BY a.deadline ASC
        """
    )


async def get_today_assignments(
    conn: asyncpg.Connection,
    day_start: datetime,
    day_end: datetime,
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
        JOIN   clients c ON c.id = a.client_id
        WHERE  a.is_active = TRUE
          AND  a.deadline >= $1
          AND  a.deadline <  $2
          AND  a.status NOT IN ('Submitted', 'Cancelled')
        ORDER  BY a.deadline ASC
        """,
        day_start,
        day_end,
    )


async def create_assignment(
    conn: asyncpg.Connection,
    data: CreateAssignmentRequest,
) -> asyncpg.Record:
    return await conn.fetchrow(
        f"""
        INSERT INTO assignments
            (client_id, assignment_type, course, word_count,
             estimated_hours, deadline, payment_kes, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, client_id, assignment_type, course, word_count,
                  estimated_hours, deadline, status, payment_kes, notes,
                  is_active, received_at, submitted_at, created_at, updated_at
        """,
        data.client_id,
        data.assignment_type,
        data.course,
        data.word_count,
        data.estimated_hours,
        data.deadline,
        data.payment_kes,
        data.notes,
    )


async def update_assignment_status(
    conn: asyncpg.Connection,
    assignment_id: UUID,
    new_status: AssignmentStatus,
) -> asyncpg.Record | None:
    """
    Updates assignment status, sets submitted_at when status becomes 'Submitted',
    writes a row to assignment_status_log, and returns the updated assignment
    with client_name.  Returns None if the assignment does not exist or is inactive.
    All operations run inside a single transaction.
    """
    async with conn.transaction():
        # Fetch current status — also confirms the row exists and is active
        current = await conn.fetchrow(
            """
            SELECT status
            FROM   assignments
            WHERE  id = $1 AND is_active = TRUE
            """,
            assignment_id,
        )
        if current is None:
            return None

        previous_status: str = current["status"]

        # Update the assignment row
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

        # Write the status-change audit log
        await conn.execute(
            """
            INSERT INTO assignment_status_log
                (assignment_id, previous_status, new_status)
            VALUES ($1, $2, $3)
            """,
            assignment_id,
            previous_status,
            new_status,
        )

    # Re-fetch with client_name JOIN so the response shape is consistent
    return await conn.fetchrow(
        f"""
        SELECT {_ASSIGNMENT_COLS}
        FROM   assignments a
        JOIN   clients c ON c.id = a.client_id
        WHERE  a.id = $1
        """,
        assignment_id,
    )
