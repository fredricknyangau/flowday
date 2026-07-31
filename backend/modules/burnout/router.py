from datetime import datetime, timedelta, timezone
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from dependencies import get_connection, get_tenant_id
from modules.auth.queries import get_tenant_settings
from modules.burnout.queries import (
    get_due_soon_count,
    get_overdue_count,
    get_protected_block_skipped_on_date,
    get_protected_blocks,
    get_skipped_count_for_block,
    get_tenant_daily_capacity,
    get_today_planned_hours,
    get_today_utc_window,
)

router = APIRouter()


class BurnoutStatusResponse(BaseModel):
    is_at_risk: bool
    trigger_signal: str | None = None


@router.get("/status", response_model=BurnoutStatusResponse)
async def check_burnout_status(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    try:
        # 1. More than 3 overdue assignments for this tenant
        overdue_count = await get_overdue_count(conn, tenant_id)
        if overdue_count > 3:
            return BurnoutStatusResponse(
                is_at_risk=True,
                trigger_signal="More than 3 overdue assignments at once.",
            )

        # 2. More than 5 assignments due in the next 24 hours for this tenant
        now_utc = datetime.now(timezone.utc)
        in_24h_utc = now_utc + timedelta(hours=24)
        due_soon_count = await get_due_soon_count(conn, tenant_id, now_utc, in_24h_utc)
        if due_soon_count > 5:
            return BurnoutStatusResponse(
                is_at_risk=True,
                trigger_signal="More than 5 assignments due in the next 24 hours.",
            )

        # 3. Proactive capacity check: today's planned estimated_hours vs daily_capacity_hours
        try:
            day_start_utc, day_end_utc = await get_today_utc_window(conn, tenant_id)
            planned_hours = float(await get_today_planned_hours(conn, tenant_id, day_start_utc, day_end_utc))
            daily_capacity_hours = float(await get_tenant_daily_capacity(conn, tenant_id))

            if planned_hours > daily_capacity_hours:
                planned_str = f"{planned_hours:g}"
                capacity_str = f"{daily_capacity_hours:g}"
                return BurnoutStatusResponse(
                    is_at_risk=True,
                    trigger_signal=(
                        f"{planned_str} hours of work planned today against your {capacity_str}-hour capacity "
                        f"— consider deferring something"
                    ),
                )
        except Exception as cap_err:
            import logging
            logging.getLogger(__name__).warning("Error during burnout capacity check: %s", cap_err)

        # 4. Reading block or sleep block skipped > 3 days in a row (for this tenant)
        protected_blocks = await get_protected_blocks(conn, tenant_id)
        tz, _, _ = await get_tenant_settings(conn, tenant_id)
        now_local = datetime.now(tz).date()

        for pb in protected_blocks:
            skipped_count = await get_skipped_count_for_block(
                conn,
                tenant_id,
                pb["id"],
                now_local - timedelta(days=2),
                now_local,
            )
            if skipped_count >= 3:
                return BurnoutStatusResponse(
                    is_at_risk=True,
                    trigger_signal=f"Protected block '{pb['label']}' was skipped 3 days in a row.",
                )

        return BurnoutStatusResponse(is_at_risk=False, trigger_signal=None)

    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Unhandled error in check_burnout_status: %s", exc, exc_info=True)
        return BurnoutStatusResponse(is_at_risk=False, trigger_signal=None)


class StreakResponse(BaseModel):
    streak_days: int


@router.get("/streak", response_model=StreakResponse)
async def get_protected_streak(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    tz, _, _ = await get_tenant_settings(conn, tenant_id)
    now_local = datetime.now(tz).date()
    streak = 0

    # Look back up to 30 days
    for day_offset in range(30):
        check_date = now_local - timedelta(days=day_offset)
        skipped = await get_protected_block_skipped_on_date(conn, tenant_id, check_date)
        if skipped == 0:
            streak += 1
        else:
            break

    return StreakResponse(streak_days=streak)
