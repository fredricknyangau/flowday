import math
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


AssignmentType = Literal[
    "Discussion post",
    "Essay",
    "Assignment",
    "Module response",
    "Knowledge quiz",
    "Research paper",
    "Exam",
    "Simulation",
    "Other",
]

AssignmentStatus = Literal[
    "Not started",
    "In progress",
    "Submitted",
    "Overdue",
    "Cancelled",
]


def _ceil_to_half(value: float) -> Decimal:
    """Round up to the nearest 0.5 (e.g. 1.1 → 1.5, 2.0 → 2.0, 2.1 → 2.5)."""
    return Decimal(str(math.ceil(value * 2) / 2))


class AssignmentResponse(BaseModel):
    id: UUID
    client_id: UUID
    client_name: str | None = None
    client_priority: str | None = None
    assignment_type: AssignmentType
    course: str | None
    word_count: int | None
    estimated_hours: Decimal | None
    deadline: datetime
    status: AssignmentStatus
    payment_kes: Decimal | None
    notes: str | None
    is_active: bool
    received_at: datetime
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateAssignmentRequest(BaseModel):
    client_id: UUID
    assignment_type: AssignmentType
    course: str | None = Field(default=None, max_length=150)
    word_count: int | None = Field(default=None, gt=0)
    deadline: datetime
    payment_kes: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None

    # estimated_hours is NOT accepted from the caller — it is derived from
    # word_count in create_assignment() (queries.py) via _ceil_to_half.
    # It is intentionally absent here so Pydantic never touches it.


class UpdateAssignmentStatusRequest(BaseModel):
    status: AssignmentStatus


class UpdateAssignmentRequest(BaseModel):
    client_id: UUID
    assignment_type: AssignmentType
    course: str | None = Field(default=None, max_length=150)
    word_count: int | None = Field(default=None, gt=0)
    deadline: datetime
    payment_kes: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None


class SubtaskResponse(BaseModel):
    id: UUID
    assignment_id: UUID
    title: str
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateSubtaskRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class ToggleSubtaskRequest(BaseModel):
    is_completed: bool


