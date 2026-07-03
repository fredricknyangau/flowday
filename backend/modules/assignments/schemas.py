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
    client_id: UUID
    client_name: str
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

    # estimated_hours is computed — not accepted from the caller
    estimated_hours: Decimal | None = Field(default=None, exclude=True, init=False)

    @model_validator(mode="after")
    def compute_estimated_hours(self) -> "CreateAssignmentRequest":
        if self.word_count is not None:
            self.estimated_hours = _ceil_to_half(self.word_count / 300)
        return self


class UpdateAssignmentStatusRequest(BaseModel):
    status: AssignmentStatus
