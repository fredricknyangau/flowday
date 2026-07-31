from uuid import UUID
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    workspace_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str | None = Field(default=None, max_length=150)


class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str


class UserResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str | None = None
    workspace_name: str

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class TenantSettingsResponse(BaseModel):
    timezone: str
    day_boundary_hour: int
    daily_capacity_hours: float = 8.0
    reminder_minutes_before: int = 120

    model_config = {"from_attributes": True}


class UpdateTenantSettingsRequest(BaseModel):
    timezone: str | None = None
    day_boundary_hour: int | None = Field(default=None, ge=0, le=23)
    daily_capacity_hours: float | None = Field(default=None, gt=0.0, le=24.0)
    reminder_minutes_before: int | None = Field(default=None, ge=5, le=1440)

