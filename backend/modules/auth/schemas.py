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
