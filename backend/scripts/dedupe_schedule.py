import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from config import settings
import asyncpg

async def dedupe():
    print("Connecting to database...")
    conn = await asyncpg.connect(settings.database_url)
    
    # Keep the row with the lowest id for each start_time/label pair
    # Delete the rest.
    query = """
    DELETE FROM schedule_blocks
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id, ROW_NUMBER() OVER(PARTITION BY start_time, label ORDER BY created_at ASC) as row_num
            FROM schedule_blocks
        ) t
        WHERE t.row_num > 1
    );
    """
    
    print("Executing dedupe query...")
    status = await conn.execute(query)
    print("Result:", status)
    
    await conn.close()
    print("Dedupe finished.")

if __name__ == "__main__":
    asyncio.run(dedupe())
