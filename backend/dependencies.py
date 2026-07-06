import asyncpg
from database import get_pool
from fastapi import Depends


async def get_connection(
    pool: asyncpg.Pool = Depends(get_pool),
) -> asyncpg.Connection:
    async with pool.acquire() as connection:
        yield connection
