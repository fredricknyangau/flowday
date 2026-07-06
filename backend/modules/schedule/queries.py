import asyncpg


async def get_all_schedule_blocks(conn: asyncpg.Connection) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT DISTINCT ON (start_time, label)
               id, start_time, label, block_type, is_protected,
               sort_order, notes, is_active, created_at, updated_at
        FROM schedule_blocks
        WHERE is_active = TRUE
        ORDER BY start_time ASC, label ASC, sort_order ASC
        """
    )
