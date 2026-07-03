import asyncpg
from fastapi import APIRouter, Depends

from dependencies import get_connection
from modules.schedule.queries import get_all_schedule_blocks
from modules.schedule.schemas import ScheduleBlockResponse

router = APIRouter()


@router.get("", response_model=list[ScheduleBlockResponse])
async def list_schedule_blocks(conn: asyncpg.Connection = Depends(get_connection)):
    rows = await get_all_schedule_blocks(conn)
    return [ScheduleBlockResponse(**dict(row)) for row in rows]
