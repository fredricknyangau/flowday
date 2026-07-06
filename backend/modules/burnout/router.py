import asyncpg
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pydantic import BaseModel

from dependencies import get_connection

router = APIRouter()

class BurnoutStatusResponse(BaseModel):
    is_at_risk: bool
    trigger_signal: str | None = None

_NAIROBI = ZoneInfo("Africa/Nairobi")

@router.get("/status", response_model=BurnoutStatusResponse)
async def check_burnout_status(conn: asyncpg.Connection = Depends(get_connection)):
    # 1. More than 3 overdue assignments
    overdue_count = await conn.fetchval(
        "SELECT count(*) FROM assignments WHERE status = 'Overdue' AND is_active = TRUE"
    )
    if overdue_count > 3:
        return BurnoutStatusResponse(is_at_risk=True, trigger_signal="More than 3 overdue assignments at once.")

    # 2. More than 5 assignments due in the next 24 hours
    now_utc = datetime.now(timezone.utc)
    in_24h_utc = now_utc + timedelta(hours=24)
    due_soon_count = await conn.fetchval(
        """
        SELECT count(*) FROM assignments 
        WHERE deadline > $1 AND deadline <= $2 
          AND status NOT IN ('Submitted', 'Cancelled')
          AND is_active = TRUE
        """,
        now_utc, in_24h_utc
    )
    if due_soon_count > 5:
        return BurnoutStatusResponse(is_at_risk=True, trigger_signal="More than 5 assignments due in the next 24 hours.")

    # 3. Reading block or sleep block skipped > 3 days in a row
    # Get protected blocks (Sleep, READING BLOCK)
    protected_blocks = await conn.fetch(
        "SELECT id, label FROM schedule_blocks WHERE block_type = 'PROTECTED' AND (label ILIKE '%sleep%' OR label ILIKE '%reading%')"
    )
    
    # Check last 3 days
    now_local = datetime.now(_NAIROBI).date()
    for pb in protected_blocks:
        # Check consecutive skips
        skipped_count = await conn.fetchval(
            """
            SELECT count(*) FROM schedule_block_logs
            WHERE schedule_block_id = $1
              AND skipped = TRUE
              AND date >= $2
              AND date <= $3
            """,
            pb["id"],
            now_local - timedelta(days=2),
            now_local
        )
        if skipped_count >= 3:
            return BurnoutStatusResponse(is_at_risk=True, trigger_signal=f"Protected block '{pb['label']}' was skipped 3 days in a row.")

    return BurnoutStatusResponse(is_at_risk=False, trigger_signal=None)
