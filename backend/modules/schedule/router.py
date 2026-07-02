from database import get_pool
from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_schedule():
    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT *
            FROM schedule_blocks
            ORDER BY sort_order ASC
            """
        )
        return [dict(row) for row in rows]
