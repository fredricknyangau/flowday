import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pywebpush import webpush, WebPushException

import asyncpg
from config import settings
from database import get_pool
from modules.assignments.tasks import mark_overdue_assignments

_NAIROBI = ZoneInfo("Africa/Nairobi")
logger = logging.getLogger(__name__)


async def send_push_notifications() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        now = datetime.now(timezone.utc)
        two_hours_from_now = now + timedelta(hours=2)

        # Fetch due assignments with their tenant_id so we can match them to
        # the correct tenant's subscriptions. Without this, Tenant A's users
        # would receive push notifications about Tenant B's deadlines.
        rows = await conn.fetch(
            """
            SELECT a.id, a.tenant_id, a.deadline, c.name AS client_name, a.assignment_type
            FROM assignments a
            JOIN clients c ON a.client_id = c.id
            WHERE a.status NOT IN ('Submitted', 'Cancelled')
              AND a.is_active = TRUE
              AND a.push_notified = FALSE
              AND a.deadline <= $1
              AND a.deadline >= $2
            """,
            two_hours_from_now,
            now - timedelta(hours=1),  # don't notify for very old ones
        )

        if not rows:
            return

        for row in rows:
            assignment_id   = row["id"]
            assignment_tenant = row["tenant_id"]
            client_name     = row["client_name"]
            assignment_type = row["assignment_type"]

            # Convert deadline to local time for friendly display
            deadline_local = row["deadline"].astimezone(_NAIROBI)
            time_str = deadline_local.strftime("%I:%M %p")

            payload = json.dumps({
                "title": "Assignment Due Soon",
                "body": f"{client_name} - {assignment_type} is due at {time_str}.",
                "url": "/",
            })

            # Only deliver to subscriptions belonging to the SAME tenant as the
            # assignment. This is the core tenant isolation fix for push:
            # previously all subscriptions received all notifications globally.
            subs = await conn.fetch(
                """
                SELECT id, endpoint, p256dh, auth
                FROM push_subscriptions
                WHERE tenant_id = $1
                """,
                assignment_tenant,
            )

            if not subs:
                # No subscriptions for this tenant — skip, but still mark notified
                # so we don't re-attempt on the next iteration.
                await conn.execute(
                    "UPDATE assignments SET push_notified = TRUE WHERE id = $1",
                    assignment_id,
                )
                continue

            for sub in subs:
                sub_info = {
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth":   sub["auth"],
                    },
                }

                try:
                    webpush(
                        subscription_info=sub_info,
                        data=payload,
                        vapid_private_key=settings.vapid_private_key,
                        vapid_claims={"sub": settings.vapid_subject},
                    )
                except WebPushException as ex:
                    logger.warning("WebPush error for tenant %s: %s", assignment_tenant, repr(ex))
                    if ex.response and ex.response.status_code in [404, 410]:
                        # Subscription expired or invalid — remove it
                        await conn.execute(
                            "DELETE FROM push_subscriptions WHERE id = $1",
                            sub["id"],
                        )

            # Mark assignment as notified after attempting all subs for this tenant
            await conn.execute(
                "UPDATE assignments SET push_notified = TRUE WHERE id = $1",
                assignment_id,
            )


async def run_push_notification_worker() -> None:
    while True:
        pool = await get_pool()
        try:
            await mark_overdue_assignments(pool)
        except Exception as e:
            logger.error("Error in overdue-transition task: %s", e, exc_info=True)
        try:
            await send_push_notifications()
        except Exception as e:
            logger.error("Error in push notification worker: %s", e, exc_info=True)
        await asyncio.sleep(15 * 60)  # 15-minute cadence
