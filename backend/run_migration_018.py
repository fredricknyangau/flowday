import asyncio
import asyncpg
import os

async def main():
    db_url = os.getenv("DATABASE_URL", "postgresql://fred:freddev@localhost:5432/flowday")
    conn = await asyncpg.connect(db_url)
    with open("migrations/018_create_assignment_subtasks.sql", "r") as f:
        sql = f.read()
    await conn.execute(sql)
    print("Migration 018 applied successfully!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
