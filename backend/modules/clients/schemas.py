from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


Priority = Literal["High", "Medium", "Low"]


class ClientResponse(BaseModel):
    id: UUID
    name: str
    platform: str
    priority: Priority
    notes: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateClientRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    platform: str = Field(default="WhatsApp", max_length=50)
    priority: Priority = "Medium"
    notes: str | None = None


class UpdateClientRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    platform: str | None = Field(default=None, max_length=50)
    priority: Priority | None = None
    notes: str | None = None
