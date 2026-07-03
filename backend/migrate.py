import asyncio
import os
import asyncpg
from config import settings

async def run_migrations():
    print(f"Connecting to database: {settings.database_url.split('@')[-1]}")
    conn = await asyncpg.connect(settings.database_url)
    
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    files = sorted([f for f in os.listdir(migrations_dir) if f.endswith(".sql")])
    
    for file in files:
        filepath = os.path.join(migrations_dir, file)
        print(f"Running migration: {file}...")
        with open(filepath, "r") as f:
            sql = f.read()
            try:
                await conn.execute(sql)
                print(f"✅ Successfully executed {file}")
            except Exception as e:
                print(f"⚠️ Error in {file}: {e}")
                
    await conn.close()
    print("All migrations finished.")

if __name__ == "__main__":
    asyncio.run(run_migrations())
