from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_connection, get_tenant_id
from modules.clients.queries import (
    create_client,
    get_all_clients,
    get_financial_analytics,
    soft_delete_client,
    update_client,
)
from modules.clients.schemas import (
    ClientResponse,
    CreateClientRequest,
    UpdateClientRequest,
)

router = APIRouter()


@router.get("/analytics")
async def get_analytics(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    return await get_financial_analytics(conn, tenant_id)


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    rows = await get_all_clients(conn, tenant_id)
    return [ClientResponse(**dict(row)) for row in rows]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_new_client(
    body: CreateClientRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_client(conn, body, tenant_id)
    return ClientResponse(**dict(row))


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_existing_client(
    client_id: UUID,
    body: UpdateClientRequest,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await update_client(conn, client_id, body, tenant_id)
    if row is None:
        # tenant_id mismatch and "not found" are intentionally indistinguishable.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found or already deleted.",
        )
    return ClientResponse(**dict(row))


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    tenant_id: UUID = Depends(get_tenant_id),
    conn: asyncpg.Connection = Depends(get_connection),
):
    # Check for active assignments belonging to this tenant's client only.
    # The tenant_id guard here prevents a cross-tenant client_id from blocking
    # a delete on a same-named client in the requesting tenant.
    active = await conn.fetchval(
        """
        SELECT 1
        FROM assignments
        WHERE client_id = $1
          AND tenant_id = $2
          AND status NOT IN ('Submitted', 'Cancelled')
          AND is_active = TRUE
        """,
        client_id,
        tenant_id,
    )
    if active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a client with active assignments.",
        )

    row = await soft_delete_client(conn, client_id, tenant_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found or already deleted.",
        )
