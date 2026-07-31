import asyncio
import asyncpg
import os

async def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://fred:freddev@localhost:5432/flowday")
    conn = await asyncpg.connect(db_url)
    try:
        # Terminate any idle-in-transaction sessions locking rows
        terminated = await conn.fetchval(
            "SELECT count(pg_terminate_backend(pid)) FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND state LIKE '%idle%';"
        )
        print("Terminated idle sessions:", terminated)

        # Ensure migration 021 columns exist
        await conn.execute("""
            ALTER TABLE tenants
                ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
                ADD COLUMN IF NOT EXISTS day_boundary_hour INTEGER NOT NULL DEFAULT 0
                CHECK (day_boundary_hour >= 0 AND day_boundary_hour <= 23);

            UPDATE tenants
            SET timezone = 'Africa/Nairobi',
                day_boundary_hour = 8
            WHERE id = 'a0000000-0000-4000-8000-000000000001';

            INSERT INTO _migrations (filename) VALUES ('021_add_tenant_timezone_and_boundary.sql') ON CONFLICT DO NOTHING;
        """)
        row = await conn.fetchrow("SELECT timezone, day_boundary_hour FROM tenants WHERE id = 'a0000000-0000-4000-8000-000000000001'")
        print("Migration 021 complete. Default tenant settings:", dict(row) if row else None)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
