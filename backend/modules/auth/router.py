from uuid import UUID

import asyncpg
from database import get_pool
from dependencies import get_connection, get_tenant_id
from fastapi import APIRouter, Depends, Header, HTTPException, status
from modules.auth.queries import (
    create_workspace_and_user,
    get_user_by_email,
    get_user_by_id,
)
from modules.auth.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    UserResponse,
)
from modules.auth.security import (
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        # Check if email is already registered
        existing = await get_user_by_email(conn, body.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists.",
            )

        hashed = hash_password(body.password)
        created = await create_workspace_and_user(
            conn=conn,
            workspace_name=body.workspace_name,
            email=body.email,
            password_hash=hashed,
            full_name=body.full_name,
        )

        token = create_access_token(
            user_id=created["id"],
            tenant_id=created["tenant_id"],
            email=created["email"],
            full_name=created["full_name"],
            workspace_name=created["workspace_name"],
        )

        return AuthResponse(
            token=token,
            user=UserResponse(**created),
        )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    pool: asyncpg.Pool = Depends(get_pool),
):
    async with pool.acquire() as conn:
        user = await get_user_by_email(conn, body.email)
        if not user or not verify_password(body.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        token = create_access_token(
            user_id=user["id"],
            tenant_id=user["tenant_id"],
            email=user["email"],
            full_name=user["full_name"],
            workspace_name=user["workspace_name"],
        )

        return AuthResponse(
            token=token,
            user=UserResponse(
                id=user["id"],
                tenant_id=user["tenant_id"],
                email=user["email"],
                full_name=user["full_name"],
                workspace_name=user["workspace_name"],
            ),
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    authorization: str | None = Header(None),
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    import jwt
    from config import settings

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")

    token = authorization.removeprefix("Bearer ")
    payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    user_id = UUID(payload["sub"])

    row = await get_user_by_id(conn, user_id, tenant_id)
    if not row:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserResponse(**dict(row))
