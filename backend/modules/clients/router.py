from fastapi import APIRouter

from database import get_pool

router = APIRouter()


@router.get("/")
async def list_clients():
    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT *
            FROM clients
            WHERE is_active = TRUE
            ORDER BY name ASC
            """
        )
        return [dict(row) for row in rows]
