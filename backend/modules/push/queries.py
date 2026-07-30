from uuid import UUID

import asyncpg
from modules.push.schemas import PushSubscription


async def save_subscription(
    conn: asyncpg.Connection,
    sub: PushSubscription,
    tenant_id: UUID,
) -> None:
    """
    Upsert a push subscription for the given tenant.

    tenant_id is required — the /push/subscribe endpoint is now authenticated,
    so every subscription is associated with a verified tenant at registration time.
    This prevents anonymous subscription registration and ensures push_subscriptions
    rows are always scoped for RLS enforcement.
    """
    await conn.execute(
        """
        INSERT INTO push_subscriptions (tenant_id, endpoint, p256dh, auth)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (endpoint) DO UPDATE
        SET tenant_id  = EXCLUDED.tenant_id,
            p256dh     = EXCLUDED.p256dh,
            auth       = EXCLUDED.auth,
            created_at = NOW()
        """,
        tenant_id,
        sub.endpoint,
        sub.keys.p256dh,
        sub.keys.auth,
    )


async def get_all_subscriptions(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE tenant_id = $1
        """,
        tenant_id,
    )


async def delete_subscription(conn: asyncpg.Connection, endpoint: str) -> None:
    await conn.execute(
        "DELETE FROM push_subscriptions WHERE endpoint = $1",
        endpoint,
    )
