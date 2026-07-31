import asyncio
import json
import logging
from datetime import datetime, timezone

import asyncpg
from config import settings
from database import get_pool
from modules.assignments.tasks import mark_overdue_assignments
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


async def send_push_notifications() -> None:
    pool = await get_pool()
    async with pool.acquire() as conn:
        now = datetime.now(timezone.utc)

        # Filter per-row using the effective reminder window:
        #   COALESCE(assignment-level override, tenant workspace default)
        # This replaces the old global "two_hours_from_now" constant so each
        # assignment uses its own configured lead time.
        rows = await conn.fetch(
            """
            SELECT a.id, a.tenant_id, a.deadline, c.name AS context_name, a.assignment_type
            FROM assignments a
            JOIN contexts c ON a.context_id = c.id
            JOIN tenants  t ON a.tenant_id  = t.id
            WHERE a.status NOT IN ('Submitted', 'Cancelled')
              AND a.is_active = TRUE
              AND a.push_notified = FALSE
              AND a.deadline >= $1
              AND a.deadline <= $1 + (COALESCE(a.reminder_minutes_before, t.reminder_minutes_before) * INTERVAL '1 minute')
            """,
            now,
        )

        if not rows:
            return

        for row in rows:
            assignment_id = row["id"]
            assignment_tenant = row["tenant_id"]
            context_name = row["context_name"]
            assignment_type = row["assignment_type"]

            from modules.auth.queries import get_tenant_settings
            tz, _, _ = await get_tenant_settings(conn, assignment_tenant)
            deadline_local = row["deadline"].astimezone(tz)
            time_str = deadline_local.strftime("%I:%M %p")

            payload = json.dumps({
                "title": "Assignment Due Soon",
                "body": f"{context_name} - {assignment_type} is due at {time_str}.",
                "url": "/",
            })

            subs = await conn.fetch(
                """
                SELECT id, endpoint, p256dh, auth
                FROM push_subscriptions
                WHERE tenant_id = $1
                """,
                assignment_tenant,
            )

            if not subs:
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
                        "auth": sub["auth"],
                    },
                }

                try:
                    await asyncio.to_thread(
                        webpush,
                        subscription_info=sub_info,
                        data=payload,
                        vapid_private_key=settings.vapid_private_key,
                        vapid_claims={"sub": settings.vapid_subject},
                    )
                except WebPushException as ex:
                    logger.warning("WebPush error for tenant %s: %s", assignment_tenant, repr(ex))
                    if ex.response and ex.response.status_code in [404, 410]:
                        await conn.execute(
                            "DELETE FROM push_subscriptions WHERE id = $1",
                            sub["id"],
                        )
                except Exception as ex:
                    logger.warning("Unexpected push notification error: %s", repr(ex))

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
        await asyncio.sleep(15 * 60)
