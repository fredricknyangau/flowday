from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

ContextType = Literal["Client", "Employer", "Academic", "Personal", "Other"]
Priority = Literal["High", "Medium", "Low"]


class ContextResponse(BaseModel):
    id: UUID
    name: str
    context_type: ContextType = "Client"
    platform: str
    priority: Priority
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Aggregate stats for UI
    active_assignments_count: int = 0
    submitted_this_week_count: int = 0
    overdue_assignments_count: int = 0
    total_earnings: float = 0.0
    # Submitted but not yet paid — used by the Unpaid filter
    unpaid_kes: float = 0.0
    unpaid_count: int = 0

    model_config = {"from_attributes": True}


class CreateContextRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    context_type: ContextType = "Client"
    platform: str = Field(default="WhatsApp", max_length=50)
    priority: Priority = "Medium"
    notes: str | None = None


class UpdateContextRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    context_type: ContextType | None = None
    platform: str | None = Field(default=None, max_length=50)
    priority: Priority | None = None
    notes: str | None = None
