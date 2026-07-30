from uuid import UUID

import asyncpg


async def create_workspace_and_user(
    conn: asyncpg.Connection,
    workspace_name: str,
    email: str,
    password_hash: str,
    full_name: str | None,
) -> asyncpg.Record:
    """
    Executes workspace (tenant) creation, default schedule template seeding,
    and user creation inside a single database transaction.
    """
    async with conn.transaction():
        # 1. Create tenant workspace
        tenant = await conn.fetchrow(
            """
            INSERT INTO tenants (name, is_active)
            VALUES ($1, TRUE)
            RETURNING id, name
            """,
            workspace_name,
        )
        tenant_id = tenant["id"]

        # 2. Seed default schedule blocks for this new tenant workspace
        await conn.execute(
            """
            INSERT INTO schedule_blocks
                (tenant_id, start_time, label, block_type, is_protected, sort_order, notes)
            VALUES
                ($1, '07:30'::time, 'Wake up — check WhatsApp for updates', 'Personal', FALSE, 1, 'Check for new assignments only — do not start working yet'),
                ($1, '08:07'::time, 'Baby school drop-off', 'Family', TRUE, 2, 'Non-negotiable. Do not schedule anything here.'),
                ($1, '08:30'::time, 'Freshen up + skincare routine', 'Personal', FALSE, 3, 'Your transition time. Keep it.'),
                ($1, '09:30'::time, 'READING BLOCK', 'PROTECTED', TRUE, 4, 'Your mental reset. 60 minutes minimum.'),
                ($1, '10:30'::time, 'LEARNING BLOCK — coding', 'PROTECTED', TRUE, 5, '30 minutes every day. One lesson. No skipping.'),
                ($1, '11:00'::time, 'Chores + Breakfast', 'Personal', FALSE, 6, 'Eat properly. You are working overnight.'),
                ($1, '11:30'::time, 'Work session 1', 'Work', FALSE, 7, 'Highest urgency assignment first.'),
                ($1, '13:30'::time, 'Short break (15 min)', 'Break', FALSE, 8, 'Stand up, step away from the screen.'),
                ($1, '13:45'::time, 'Work session 2', 'Work', FALSE, 9, 'Second most urgent assignment.'),
                ($1, '16:00'::time, 'Light personal time', 'Personal', FALSE, 10, 'Avoid screens if possible.'),
                ($1, '17:00'::time, 'EVENING NAP', 'PROTECTED', TRUE, 11, '90 to 120 minutes. Fuels your overnight session.'),
                ($1, '19:00'::time, 'Work session 3', 'Work', FALSE, 12, 'Any remaining daytime deadlines.'),
                ($1, '21:00'::time, 'Break + meal', 'Break', FALSE, 13, 'Eat before the overnight push.'),
                ($1, '22:00'::time, 'OVERNIGHT MAIN WORK SESSION', 'Work', FALSE, 14, 'Longest and most intensive session.'),
                ($1, '02:00'::time, 'Wind down', 'Personal', FALSE, 15, 'Stop adding new tasks. Wrap up what you are on.'),
                ($1, '03:00'::time, 'Sleep', 'PROTECTED', TRUE, 16, 'Minimum 4 hours. Non-negotiable.')
            """,
            tenant_id,
        )

        # 3. Create user belonging to this tenant
        user = await conn.fetchrow(
            """
            INSERT INTO users (tenant_id, email, password_hash, full_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, tenant_id, email, full_name
            """,
            tenant_id,
            email,
            password_hash,
            full_name,
        )

        return {
            "id": user["id"],
            "tenant_id": tenant_id,
            "email": user["email"],
            "full_name": user["full_name"],
            "workspace_name": tenant["name"],
        }


async def get_user_by_email(
    conn: asyncpg.Connection,
    email: str,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT u.id, u.tenant_id, u.email, u.password_hash, u.full_name, t.name AS workspace_name
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE u.email = $1 AND t.is_active = TRUE
        """,
        email,
    )


async def get_user_by_id(
    conn: asyncpg.Connection,
    user_id: UUID,
    tenant_id: UUID,
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        """
        SELECT u.id, u.tenant_id, u.email, u.full_name, t.name AS workspace_name
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE u.id = $1 AND u.tenant_id = $2 AND t.is_active = TRUE
        """,
        user_id,
        tenant_id,
    )
