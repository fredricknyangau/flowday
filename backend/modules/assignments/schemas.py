import math
from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

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
    context_id: UUID
    context_name: str | None = None
    context_priority: str | None = None
    context_type: str | None = None

    # Deprecated alias fields for backward compatibility during rollout
    client_id: UUID | None = None
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
    reminder_minutes_before: int | None = None
    is_active: bool
    received_at: datetime
    submitted_at: datetime | None
    paid_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def populate_alias_fields(self):
        if self.client_id is None:
            self.client_id = self.context_id
        if self.client_name is None:
            self.client_name = self.context_name
        if self.client_priority is None:
            self.client_priority = self.context_priority
        return self

    model_config = {"from_attributes": True}


class CreateAssignmentRequest(BaseModel):
    context_id: UUID | None = None
    client_id: UUID | None = None
    assignment_type: AssignmentType
    course: str | None = Field(default=None, max_length=150)
    word_count: int | None = Field(default=None, gt=0)
    deadline: datetime
    payment_kes: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    reminder_minutes_before: int | None = Field(default=None, ge=5, le=1440)

    @model_validator(mode="after")
    def validate_context_or_client(self):
        if self.context_id is None and self.client_id is None:
            raise ValueError("context_id is required")
        if self.context_id is None:
            self.context_id = self.client_id
        if self.client_id is None:
            self.client_id = self.context_id
        return self


class UpdateAssignmentStatusRequest(BaseModel):
    status: AssignmentStatus


class MarkAssignmentPaidRequest(BaseModel):
    """Body for PATCH /assignments/{id}/payment."""
    # Optional ISO-8601 timestamp; if omitted defaults to now() in the router.
    paid_at: datetime | None = None


class UpdateAssignmentRequest(BaseModel):
    context_id: UUID | None = None
    client_id: UUID | None = None
    assignment_type: AssignmentType
    course: str | None = Field(default=None, max_length=150)
    word_count: int | None = Field(default=None, gt=0)
    deadline: datetime
    payment_kes: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None
    reminder_minutes_before: int | None = Field(default=None, ge=5, le=1440)

    @model_validator(mode="after")
    def validate_context_or_client(self):
        if self.context_id is None and self.client_id is None:
            raise ValueError("context_id is required")
        if self.context_id is None:
            self.context_id = self.client_id
        if self.client_id is None:
            self.client_id = self.context_id
        return self


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
