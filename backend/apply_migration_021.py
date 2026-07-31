import asyncio
import asyncpg
import os

async def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://fred:freddev@localhost:5432/flowday")
    conn = await asyncpg.connect(db_url)
    try:
        with open("migrations/021_add_tenant_timezone_and_boundary.sql", "r") as f:
            sql = f.read()
        await conn.execute(sql)
        await conn.execute(
            "INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING",
            "021_add_tenant_timezone_and_boundary.sql",
        )
        row = await conn.fetchrow("SELECT timezone, day_boundary_hour FROM tenants WHERE id = 'a0000000-0000-4000-8000-000000000001'")
        print("Applied migration 021 successfully! Default tenant settings:", dict(row) if row else None)
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
