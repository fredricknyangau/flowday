import asyncio
import json
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pywebpush import webpush, WebPushException

import asyncpg
from config import settings
from database import get_pool

_NAIROBI = ZoneInfo("Africa/Nairobi")

async def send_push_notifications():
    pool = await get_pool()
    async with pool.acquire() as conn:
        now = datetime.now(timezone.utc)
        two_hours_from_now = now + timedelta(hours=2)
        
        # Find assignments due within 2 hours that haven't been notified
        rows = await conn.fetch(
            """
            SELECT a.id, a.deadline, c.name AS client_name, a.assignment_type
            FROM assignments a
            JOIN clients c ON a.client_id = c.id
            WHERE a.status NOT IN ('Submitted', 'Cancelled')
              AND a.is_active = TRUE
              AND a.push_notified = FALSE
              AND a.deadline <= $1
              AND a.deadline >= $2
            """,
            two_hours_from_now,
            now - timedelta(hours=1) # Don't notify for super old ones just in case
        )

        if not rows:
            return

        subs = await conn.fetch("SELECT id, endpoint, p256dh, auth FROM push_subscriptions")
        
        if not subs:
            return

        # Prepare WebPush payload
        # For simplicity, send one push per assignment if multiple are due
        for row in rows:
            assignment_id = row["id"]
            client_name = row["client_name"]
            assignment_type = row["assignment_type"]
            # Convert deadline to local time for friendly display
            deadline_local = row["deadline"].astimezone(_NAIROBI)
            time_str = deadline_local.strftime("%I:%M %p")
            
            payload = json.dumps({
                "title": "Assignment Due Soon",
                "body": f"{client_name} - {assignment_type} is due at {time_str}.",
                "url": "/"
            })

            for sub in subs:
                sub_info = {
                    "endpoint": sub["endpoint"],
                    "keys": {
                        "p256dh": sub["p256dh"],
                        "auth": sub["auth"]
                    }
                }
                
                try:
                    webpush(
                        subscription_info=sub_info,
                        data=payload,
                        vapid_private_key=settings.vapid_private_key,
                        vapid_claims={"sub": settings.vapid_subject}
                    )
                except WebPushException as ex:
                    print(f"WebPush error: {repr(ex)}")
                    if ex.response and ex.response.status_code in [404, 410]:
                        # Subscription expired or invalid, delete it
                        await conn.execute("DELETE FROM push_subscriptions WHERE id = $1", sub["id"])
            
            # Mark assignment as notified
            await conn.execute("UPDATE assignments SET push_notified = TRUE WHERE id = $1", assignment_id)

async def run_push_notification_worker():
    while True:
        try:
            await send_push_notifications()
        except Exception as e:
            print(f"Error in push notification worker: {e}")
        await asyncio.sleep(15 * 60) # Run every 15 minutes
