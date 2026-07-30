from datetime import datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

import asyncpg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from dependencies import get_connection, get_tenant_id

router = APIRouter()


class BurnoutStatusResponse(BaseModel):
    is_at_risk: bool
    trigger_signal: str | None = None


_NAIROBI = ZoneInfo("Africa/Nairobi")


@router.get("/status", response_model=BurnoutStatusResponse)
async def check_burnout_status(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    # 1. More than 3 overdue assignments for this tenant
    overdue_count = await conn.fetchval(
        """
        SELECT count(*)
        FROM assignments
        WHERE tenant_id = $1
          AND status = 'Overdue'
          AND is_active = TRUE
        """,
        tenant_id,
    )
    if overdue_count > 3:
        return BurnoutStatusResponse(
            is_at_risk=True,
            trigger_signal="More than 3 overdue assignments at once.",
        )

    # 2. More than 5 assignments due in the next 24 hours for this tenant
    now_utc = datetime.now(timezone.utc)
    in_24h_utc = now_utc + timedelta(hours=24)
    due_soon_count = await conn.fetchval(
        """
        SELECT count(*)
        FROM assignments
        WHERE tenant_id = $1
          AND deadline > $2
          AND deadline <= $3
          AND status NOT IN ('Submitted', 'Cancelled')
          AND is_active = TRUE
        """,
        tenant_id,
        now_utc,
        in_24h_utc,
    )
    if due_soon_count > 5:
        return BurnoutStatusResponse(
            is_at_risk=True,
            trigger_signal="More than 5 assignments due in the next 24 hours.",
        )

    # 3. Reading block or sleep block skipped > 3 days in a row (for this tenant)
    protected_blocks = await conn.fetch(
        """
        SELECT id, label
        FROM schedule_blocks
        WHERE tenant_id = $1
          AND block_type = 'PROTECTED'
          AND is_active = TRUE
        """,
        tenant_id,
    )

    # Check last 3 days
    now_local = datetime.now(_NAIROBI).date()
    for pb in protected_blocks:
        # schedule_block_logs.tenant_id is denormalized — no JOIN needed.
        skipped_count = await conn.fetchval(
            """
            SELECT count(*)
            FROM schedule_block_logs
            WHERE tenant_id = $1
              AND schedule_block_id = $2
              AND skipped = TRUE
              AND date >= $3
              AND date <= $4
            """,
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


class StreakResponse(BaseModel):
    streak_days: int


@router.get("/streak", response_model=StreakResponse)
async def get_protected_streak(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    now_local = datetime.now(_NAIROBI).date()
    streak = 0

    # Look back up to 30 days
    for day_offset in range(30):
        check_date = now_local - timedelta(days=day_offset)
        skipped = await conn.fetchval(
            """
            SELECT count(*)
            FROM schedule_block_logs sbl
            JOIN schedule_blocks sb ON sb.id = sbl.schedule_block_id
            WHERE sbl.tenant_id = $1
              AND sb.is_protected = TRUE
              AND sbl.skipped = TRUE
              AND sbl.date = $2
            """,
            tenant_id,
            check_date,
        )
        if skipped == 0:
            streak += 1
        else:
            break

    return StreakResponse(streak_days=streak)

