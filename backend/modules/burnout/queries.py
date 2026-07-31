from datetime import date, datetime, timedelta, timezone
from uuid import UUID
import asyncpg


async def get_overdue_count(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> int:
    val = await conn.fetchval(
        """
        SELECT count(*)
        FROM assignments
        WHERE tenant_id = $1
          AND status = 'Overdue'
          AND is_active = TRUE
        """,
        tenant_id,
    )
    return val or 0


async def get_due_soon_count(
    conn: asyncpg.Connection,
    tenant_id: UUID,
    now_utc: datetime,
    in_24h_utc: datetime,
) -> int:
    val = await conn.fetchval(
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
    return val or 0


async def get_today_utc_window(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> tuple[datetime, datetime]:
    """
    Return (day_start_utc, day_end_utc) for the tenant's current work day
    based on tenant timezone and day_boundary_hour.
    """
    from modules.auth.queries import get_tenant_settings

    tz, boundary_hour, _ = await get_tenant_settings(conn, tenant_id)
    now_local = datetime.now(tz)

    if now_local.hour < boundary_hour:
        work_day_date = now_local.date() - timedelta(days=1)
    else:
        work_day_date = now_local.date()

    day_start_local = datetime(
        work_day_date.year,
        work_day_date.month,
        work_day_date.day,
        boundary_hour,
        0,
        0,
        tzinfo=tz,
    )
    day_end_local = day_start_local + timedelta(days=1)

    return (
        day_start_local.astimezone(timezone.utc),
        day_end_local.astimezone(timezone.utc),
    )


async def get_today_planned_hours(
    conn: asyncpg.Connection,
    tenant_id: UUID,
    day_start_utc: datetime,
    day_end_utc: datetime,
) -> float:
    val = await conn.fetchval(
        """
        SELECT COALESCE(SUM(estimated_hours), 0)
        FROM assignments
        WHERE tenant_id = $1
          AND deadline >= $2
          AND deadline < $3
          AND status NOT IN ('Submitted', 'Cancelled')
          AND is_active = TRUE
        """,
        tenant_id,
        day_start_utc,
        day_end_utc,
    )
    return float(val) if val is not None else 0.0


async def get_tenant_daily_capacity(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> float:
    try:
        val = await conn.fetchval(
            """
            SELECT daily_capacity_hours
            FROM tenants
            WHERE id = $1
            """,
            tenant_id,
        )
        return float(val) if val is not None else 8.0
    except Exception:
        return 8.0


async def get_protected_blocks(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> list[asyncpg.Record]:
    return await conn.fetch(
        """
        SELECT id, label
        FROM schedule_blocks
        WHERE tenant_id = $1
          AND block_type = 'PROTECTED'
          AND is_active = TRUE
        """,
        tenant_id,
    )


async def get_skipped_count_for_block(
    conn: asyncpg.Connection,
    tenant_id: UUID,
    schedule_block_id: UUID,
    start_date: date,
    end_date: date,
) -> int:
    val = await conn.fetchval(
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
        schedule_block_id,
        start_date,
        end_date,
    )
    return val or 0


async def get_protected_block_skipped_on_date(
    conn: asyncpg.Connection,
    tenant_id: UUID,
    check_date: date,
) -> int:
    val = await conn.fetchval(
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
    return val or 0
