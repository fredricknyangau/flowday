import asyncpg
from modules.push.schemas import PushSubscription

async def save_subscription(conn: asyncpg.Connection, sub: PushSubscription):
    # Upsert based on endpoint
    await conn.execute(
        """
        INSERT INTO push_subscriptions (endpoint, p256dh, auth)
        VALUES ($1, $2, $3)
        ON CONFLICT (endpoint) DO UPDATE 
        SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, created_at = NOW()
        """,
        sub.endpoint,
        sub.keys.p256dh,
        sub.keys.auth,
    )

async def get_all_subscriptions(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    return await conn.fetch("SELECT endpoint, p256dh, auth FROM push_subscriptions")

async def delete_subscription(conn: asyncpg.Connection, endpoint: str):
    await conn.execute("DELETE FROM push_subscriptions WHERE endpoint = $1", endpoint)
