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
    get_subtasks,
    get_today_assignments,
    toggle_subtask,
    update_assignment,
    update_assignment_status,
)
from modules.assignments.schemas import (
    AssignmentResponse,
    CreateAssignmentRequest,
    CreateSubtaskRequest,
    SubtaskResponse,
    ToggleSubtaskRequest,
    UpdateAssignmentRequest,
    UpdateAssignmentStatusRequest,
)

router = APIRouter()

_NAIROBI = ZoneInfo("Africa/Nairobi")
_WORK_DAY_START_HOUR = 8  # 08:00 local = start of a new work day


def _today_utc_window() -> tuple[datetime, datetime]:
    """
    Return (day_start_utc, day_end_utc) for the *current* Nairobi work day.

    A work day runs from 08:00 Nairobi to 07:59 the *following* calendar day,
    meaning any deadline from 08:00 today up to (but not including) 08:00
    tomorrow belongs to today's plan.

    Examples (Nairobi local time → UTC window):
      - Current time  09:30 Thu  →  window  Thu 08:00–Fri 08:00 EAT
                                   =  Thu 05:00–Fri 05:00 UTC
      - Current time  02:00 Fri  →  work day is still *Thursday*
                                   →  window  Thu 08:00–Fri 08:00 EAT
    """
    now_nairobi = datetime.now(_NAIROBI)

    # If we are before 08:00 local, we are still on the *previous* work day
    if now_nairobi.hour < _WORK_DAY_START_HOUR:
        work_day_date = now_nairobi.date() - timedelta(days=1)
    else:
        work_day_date = now_nairobi.date()

    # Build 08:00 local on the work-day date, then convert to UTC
    day_start_local = datetime(
        work_day_date.year,
        work_day_date.month,
        work_day_date.day,
        _WORK_DAY_START_HOUR,
        0,
        0,
        tzinfo=_NAIROBI,
    )
    day_end_local = day_start_local + timedelta(days=1)  # 08:00 next calendar day

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
    day_start, day_end = _today_utc_window()
    rows = await get_today_assignments(conn, day_start, day_end, tenant_id)
    return [AssignmentResponse(**dict(row)) for row in rows]


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_assignment(
    body: CreateAssignmentRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_assignment(conn, body, tenant_id)
    # create_assignment RETURNING does not include client_name; fetch it with JOIN.
    # tenant_id guard on the re-fetch is belt-and-suspenders.
    full_row = await conn.fetchrow(
        """
        SELECT a.id, a.client_id, c.name AS client_name, c.priority AS client_priority,
               a.assignment_type, a.course, a.word_count, a.estimated_hours,
               a.deadline, a.status, a.payment_kes, a.notes, a.is_active,
               a.received_at, a.submitted_at, a.created_at, a.updated_at
        FROM   assignments a
        LEFT JOIN clients c ON c.id = a.client_id
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
        # "not found" and "wrong tenant" are intentionally indistinguishable.
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


