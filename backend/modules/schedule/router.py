from fastapi import APIRouter

from database import get_pool

router = APIRouter()


async def fetch_schedule_blocks():
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


@router.get("/")
async def list_schedule():
    return await fetch_schedule_blocks()
