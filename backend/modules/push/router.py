from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, status

from dependencies import get_connection, get_tenant_id
from modules.push.schemas import PushSubscription
from modules.push.queries import save_subscription

router = APIRouter()


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_push(
    body: PushSubscription,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    """
    Register a Web Push subscription for the authenticated tenant.

    This endpoint is now authenticated (JWT required). The subscribe() call
    in usePushNotifications.ts runs from the browser tab's JS context — not
    from inside the service worker — so it has full access to the page's auth
    token. Only the *incoming push delivery* (handled in sw.ts) is service-worker
    constrained; registration is a normal authenticated API call.
    """
    await save_subscription(conn, body, tenant_id)
    return {"message": "Subscription saved successfully"}
