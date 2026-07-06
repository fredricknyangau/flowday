import asyncpg
from fastapi import APIRouter, Depends, status

from dependencies import get_connection
from modules.push.schemas import PushSubscription
from modules.push.queries import save_subscription

router = APIRouter()

@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_push(
    body: PushSubscription,
    conn: asyncpg.Connection = Depends(get_connection),
):
    await save_subscription(conn, body)
    return {"message": "Subscription saved successfully"}
