from uuid import UUID

import asyncpg

from modules.clients.schemas import CreateClientRequest, UpdateClientRequest


async def get_all_clients(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT id, name, platform, priority, notes, is_active, created_at, updated_at
        FROM clients
        WHERE is_active = TRUE
        ORDER BY name ASC
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
