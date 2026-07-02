from datetime import datetime, timedelta, timezone

from database import get_pool
from fastapi import APIRouter

router = APIRouter()


async def fetch_assignments(query: str, *args):
    pool = await get_pool()
    async with pool.acquire() as connection:
        rows = await connection.fetch(query, *args)
        return [dict(row) for row in rows]


@router.get("/")
async def list_assignments():
    return await fetch_assignments(
        """
        SELECT assignments.*, clients.name AS client_name
        FROM assignments
        JOIN clients ON clients.id = assignments.client_id
        WHERE assignments.is_active = TRUE
        ORDER BY assignments.deadline ASC
        """
    )


@router.get("/today")
async def today_assignments():
    now = datetime.now(timezone.utc)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_tomorrow = start_of_today + timedelta(days=1)

    return await fetch_assignments(
        """
        SELECT assignments.*, clients.name AS client_name
        FROM assignments
        JOIN clients ON clients.id = assignments.client_id
        WHERE assignments.is_active = TRUE
          AND assignments.deadline >= $1
          AND assignments.deadline < $2
        ORDER BY assignments.deadline ASC
        """,
        start_of_today,
        start_of_tomorrow,
    )
