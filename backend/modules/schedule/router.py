from datetime import date
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from dependencies import get_connection, get_tenant_id
from modules.schedule.queries import get_all_schedule_blocks
from modules.schedule.schemas import ScheduleBlockResponse

router = APIRouter()


class SkipBlockRequest(BaseModel):
    date: date
    skipped: bool


@router.get("", response_model=list[ScheduleBlockResponse])
async def list_schedule_blocks(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    rows = await get_all_schedule_blocks(conn, tenant_id)
    return [ScheduleBlockResponse(**dict(row)) for row in rows]


@router.post("/{block_id}/skip", status_code=status.HTTP_200_OK)
async def toggle_skip_block(
    block_id: UUID,
    body: SkipBlockRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    # Verify the block belongs to this tenant before writing the log row.
    # "not found" and "wrong tenant" are intentionally indistinguishable — 404.
    block_exists = await conn.fetchval(
        """
        SELECT 1 FROM schedule_blocks
        WHERE id = $1
          AND tenant_id = $2
          AND is_active = TRUE
        """,
        block_id,
        tenant_id,
    )
    if not block_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule block {block_id} not found.",
        )

    # tenant_id is denormalized into schedule_block_logs so RLS on that table
    # can evaluate it without joining back to schedule_blocks.
    await conn.execute(
        """
        INSERT INTO schedule_block_logs (date, schedule_block_id, tenant_id, skipped)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (date, schedule_block_id) DO UPDATE
        SET skipped = EXCLUDED.skipped, updated_at = NOW()
        """,
        body.date,
        block_id,
        tenant_id,
        body.skipped,
    )
    return {"status": "ok"}
