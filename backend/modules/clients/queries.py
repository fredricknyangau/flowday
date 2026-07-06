from uuid import UUID

import asyncpg

from modules.clients.schemas import CreateClientRequest, UpdateClientRequest


async def get_all_clients(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT 
            c.id, c.name, c.platform, c.priority, c.notes, c.is_active, c.created_at, c.updated_at,
            COUNT(a.id) FILTER (WHERE a.status NOT IN ('Submitted', 'Cancelled') AND a.is_active = TRUE) AS active_assignments_count,
            COUNT(a.id) FILTER (WHERE a.status = 'Submitted' AND a.submitted_at >= date_trunc('week', NOW()) AND a.is_active = TRUE) AS submitted_this_week_count,
            COUNT(a.id) FILTER (WHERE a.status = 'Overdue' AND a.is_active = TRUE) AS overdue_assignments_count,
            COALESCE(SUM(a.payment_kes) FILTER (WHERE a.status = 'Submitted' AND a.is_active = TRUE), 0) AS total_earnings
        FROM clients c
        LEFT JOIN assignments a ON c.id = a.client_id
        WHERE c.is_active = TRUE
        GROUP BY c.id
        ORDER BY c.name ASC
        """
    )


async def create_client(
    conn: asyncpg.Connection,
    data: CreateClientRequest,
) -> asyncpg.Record:
    return await conn.fetchrow(
        """
        INSERT INTO clients (name, platform, priority, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, platform, priority, notes, is_active, created_at, updated_at
        """,
        data.name,
        data.platform,
        data.priority,
        data.notes,
    )


async def update_client(
    conn: asyncpg.Connection,
    client_id: UUID,
    data: UpdateClientRequest,
) -> asyncpg.Record | None:
    # Build SET clause dynamically from only the fields that were provided
    fields = data.model_dump(exclude_unset=True)
    if not fields:
        # Nothing to update — return current state
        return await conn.fetchrow(
            """
            SELECT id, name, platform, priority, notes, is_active, created_at, updated_at
            FROM clients
            WHERE id = $1 AND is_active = TRUE
            """,
            client_id,
        )

    set_clauses = [f"{col} = ${i + 1}" for i, col in enumerate(fields)]
    set_clauses.append(f"updated_at = NOW()")
    set_sql = ", ".join(set_clauses)
    values = list(fields.values())
    values.append(client_id)  # last positional param for WHERE

    return await conn.fetchrow(
        f"""
        UPDATE clients
        SET {set_sql}
        WHERE id = ${len(values)} AND is_active = TRUE
        RETURNING id, name, platform, priority, notes, is_active, created_at, updated_at
        """,
        *values,
    )


async def soft_delete_client(
    conn: asyncpg.Connection,
    client_id: UUID,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        UPDATE clients
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = $1 AND is_active = TRUE
        RETURNING id
        """,
        client_id,
    )
