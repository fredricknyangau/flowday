from uuid import UUID

import asyncpg


async def get_all_schedule_blocks(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    # DISTINCT ON removed: deduplication is now prevented at the DB level by
    # migration 015 (uq_schedule_blocks_tenant_time_label unique constraint,
    # which replaced the single-tenant uq_schedule_blocks_time_label from 010).
    return await conn.fetch(
        """
        SELECT id, start_time, label, block_type, is_protected,
               sort_order, notes, is_active, created_at, updated_at
        FROM schedule_blocks
        WHERE tenant_id = $1
          AND is_active = TRUE
        ORDER BY start_time ASC, sort_order ASC
        """,
        tenant_id,
    )
