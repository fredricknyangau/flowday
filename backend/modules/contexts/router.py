from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_connection, get_tenant_id
from modules.contexts.queries import (
    create_context,
    get_all_contexts,
    get_financial_analytics,
    soft_delete_context,
    update_context,
)
from modules.contexts.schemas import (
    ContextResponse,
    CreateContextRequest,
    UpdateContextRequest,
)

router = APIRouter()


@router.get("/analytics")
async def get_analytics(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    return await get_financial_analytics(conn, tenant_id)


@router.get("", response_model=list[ContextResponse])
async def list_contexts(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    rows = await get_all_contexts(conn, tenant_id)
    return [ContextResponse(**dict(row)) for row in rows]


@router.post("", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
async def create_new_context(
    body: CreateContextRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_context(conn, body, tenant_id)
    return ContextResponse(**dict(row))


@router.patch("/{context_id}", response_model=ContextResponse)
async def update_existing_context(
    context_id: UUID,
    body: UpdateContextRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await update_context(conn, context_id, body, tenant_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found or already deleted.",
        )
    return ContextResponse(**dict(row))


@router.delete("/{context_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_context(
    context_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    active = await conn.fetchval(
        """
        SELECT 1
        FROM assignments
        WHERE context_id = $1
          AND tenant_id = $2
          AND status NOT IN ('Submitted', 'Cancelled')
          AND is_active = TRUE
        """,
        context_id,
        tenant_id,
    )
    if active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a context with active assignments.",
        )

    row = await soft_delete_context(conn, context_id, tenant_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found or already deleted.",
        )
