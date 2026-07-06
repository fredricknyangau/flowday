import asyncpg
from fastapi import APIRouter, Depends

from dependencies import get_connection
from modules.schedule.queries import get_all_schedule_blocks
from modules.schedule.schemas import ScheduleBlockResponse

router = APIRouter()


from pydantic import BaseModel
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends, status

class SkipBlockRequest(BaseModel):
    date: date
    skipped: bool

@router.get("", response_model=list[ScheduleBlockResponse])
async def list_schedule_blocks(conn: asyncpg.Connection = Depends(get_connection)):
    rows = await get_all_schedule_blocks(conn)
    return [ScheduleBlockResponse(**dict(row)) for row in rows]

@router.post("/{block_id}/skip", status_code=status.HTTP_200_OK)
async def toggle_skip_block(
    block_id: UUID,
    body: SkipBlockRequest,
    conn: asyncpg.Connection = Depends(get_connection),
):
    await conn.execute(
        """
        INSERT INTO schedule_block_logs (date, schedule_block_id, skipped)
        VALUES ($1, $2, $3)
        ON CONFLICT (date, schedule_block_id) DO UPDATE 
        SET skipped = EXCLUDED.skipped, updated_at = NOW()
        """,
        body.date, block_id, body.skipped
    )
    return {"status": "ok"}
