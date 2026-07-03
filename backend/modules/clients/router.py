from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_connection
from modules.clients.queries import (
    create_client,
    get_all_clients,
    soft_delete_client,
    update_client,
)
from modules.clients.schemas import (
    ClientResponse,
    CreateClientRequest,
    UpdateClientRequest,
)

router = APIRouter()


@router.get("", response_model=list[ClientResponse])
async def list_clients(conn: asyncpg.Connection = Depends(get_connection)):
    rows = await get_all_clients(conn)
    return [ClientResponse(**dict(row)) for row in rows]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_new_client(
    body: CreateClientRequest,
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await create_client(conn, body)
    return ClientResponse(**dict(row))


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_existing_client(
    client_id: UUID,
    body: UpdateClientRequest,
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await update_client(conn, client_id, body)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found or already deleted.",
        )
    return ClientResponse(**dict(row))


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    conn: asyncpg.Connection = Depends(get_connection),
):
    row = await soft_delete_client(conn, client_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found or already deleted.",
        )
