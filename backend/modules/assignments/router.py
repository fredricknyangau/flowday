from datetime import datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_connection, get_tenant_id
from modules.assignments.queries import (
    create_assignment,
    create_subtask,
    delete_subtask,
    get_all_assignments,
    get_monthly_assignments,
    get_subtasks,
    get_today_assignments,
    mark_assignment_paid,
    toggle_subtask,
    update_assignment,
    update_assignment_status,
)
from modules.assignments.schemas import (
    AssignmentResponse,
    CreateAssignmentRequest,
    CreateSubtaskRequest,
    MarkAssignmentPaidRequest,
    SubtaskResponse,
    ToggleSubtaskRequest,
    UpdateAssignmentRequest,
    UpdateAssignmentStatusRequest,
)

router = APIRouter()

async def _today_utc_window(
    conn: asyncpg.Connection,
    tenant_id: UUID,
) -> tuple[datetime, datetime]:
    """
    Return (day_start_utc, day_end_utc) for the tenant's current work day.
    Determined dynamically from the tenant's stored timezone and boundary hour.
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


@router.get("", response_model=list[AssignmentResponse])
async def list_assignments(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    rows = await get_all_assignments(conn, tenant_id)
    return [AssignmentResponse(**dict(row)) for row in rows]


@router.get("/today", response_model=list[AssignmentResponse])
async def today_assignments(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    day_start, day_end = await _today_utc_window(conn, tenant_id)
    rows = await get_today_assignments(conn, day_start, day_end, tenant_id)
    return [AssignmentResponse(**dict(row)) for row in rows]


@router.get("/monthly", response_model=list[AssignmentResponse])
async def monthly_assignments(
    month: str | None = None,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    from modules.auth.queries import get_tenant_settings
    tz, _, _ = await get_tenant_settings(conn, tenant_id)

    if month:
        try:
            year_str, month_str = month.split("-")
            year = int(year_str)
            m = int(month_str)
            start_dt = datetime(year, m, 1, 0, 0, 0, tzinfo=tz)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month format. Expected YYYY-MM",
            )
    else:
        now_local = datetime.now(tz)
        start_dt = datetime(now_local.year, now_local.month, 1, 0, 0, 0, tzinfo=tz)

    if start_dt.month == 12:
        end_dt = datetime(start_dt.year + 1, 1, 1, 0, 0, 0, tzinfo=tz)
    else:
        end_dt = datetime(start_dt.year, start_dt.month + 1, 1, 0, 0, 0, tzinfo=tz)

    start_utc = start_dt.astimezone(timezone.utc)
    end_utc = end_dt.astimezone(timezone.utc)

    rows = await get_monthly_assignments(conn, start_utc, end_utc, tenant_id)
    return [AssignmentResponse(**dict(row)) for row in rows]


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_assignment(
    body: CreateAssignmentRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_assignment(conn, body, tenant_id)
    full_row = await conn.fetchrow(
        """
        SELECT a.id, a.context_id, c.name AS context_name, c.priority AS context_priority, c.context_type AS context_type,
               a.assignment_type, a.course, a.word_count, a.estimated_hours,
               a.deadline, a.status, a.payment_kes, a.notes, a.reminder_minutes_before,
               a.is_active, a.received_at, a.submitted_at, a.paid_at, a.created_at, a.updated_at
        FROM   assignments a
        LEFT JOIN contexts c ON c.id = a.context_id
        WHERE  a.id = $1
          AND  a.tenant_id = $2
        """,
        row["id"],
        tenant_id,
    )
    return AssignmentResponse(**dict(full_row))


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def put_assignment(
    assignment_id: UUID,
    body: UpdateAssignmentRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await update_assignment(conn, assignment_id, tenant_id, body)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found.",
        )
    return AssignmentResponse(**dict(row))


@router.patch("/{assignment_id}/status", response_model=AssignmentResponse)
async def patch_assignment_status(
    assignment_id: UUID,
    body: UpdateAssignmentStatusRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await update_assignment_status(conn, assignment_id, body.status, tenant_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found or already deleted.",
        )
    return AssignmentResponse(**dict(row))


@router.patch("/{assignment_id}/payment", response_model=AssignmentResponse)
async def patch_assignment_payment(
    assignment_id: UUID,
    body: MarkAssignmentPaidRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    """
    Mark an assignment as paid.
    - `paid_at` is optional: defaults to now() if omitted.
    - Returns 422 if the assignment has no payment_kes set.
    - Returns 404 if the assignment doesn't exist or belongs to another tenant.
    """
    from datetime import timezone
    effective_paid_at = body.paid_at or datetime.now(timezone.utc)
    try:
        row = await mark_assignment_paid(conn, assignment_id, tenant_id, effective_paid_at)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found or already deleted.",
        )
    return AssignmentResponse(**dict(row))


# ── SUBTASK ROUTERS ──────────────────────────────────────────────────────────

@router.get("/{assignment_id}/subtasks", response_model=list[SubtaskResponse])
async def list_subtasks(
    assignment_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    rows = await get_subtasks(conn, assignment_id, tenant_id)
    return [SubtaskResponse(**dict(r)) for r in rows]


@router.post("/{assignment_id}/subtasks", response_model=SubtaskResponse, status_code=status.HTTP_201_CREATED)
async def add_subtask(
    assignment_id: UUID,
    body: CreateSubtaskRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_subtask(conn, assignment_id, tenant_id, body.title)
    return SubtaskResponse(**dict(row))


@router.patch("/{assignment_id}/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def patch_subtask(
    assignment_id: UUID,
    subtask_id: UUID,
    body: ToggleSubtaskRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await toggle_subtask(conn, subtask_id, tenant_id, body.is_completed)
    if not row:
        raise HTTPException(status_code=404, detail="Subtask not found.")
    return SubtaskResponse(**dict(row))


@router.delete("/{assignment_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_subtask(
    assignment_id: UUID,
    subtask_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    deleted = await delete_subtask(conn, subtask_id, tenant_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subtask not found.")
