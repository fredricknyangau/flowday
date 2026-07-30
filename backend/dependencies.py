"""
Shared FastAPI dependencies for Flowday.

Auth architecture:
  - get_tenant_id  — decodes the Bearer JWT, returns a validated UUID tenant_id.
  - get_connection — acquires a DB connection, opens a transaction, sets the
                     RLS context (SET LOCAL app.tenant_id) from the verified JWT.
  - verify_api_key — DEPRECATED; retained during JWT transition period.

The two-layer isolation model:
  1. Query layer: every query function receives tenant_id as an explicit parameter
     and includes it in its WHERE clause (primary defense).
  2. RLS layer: SET LOCAL app.tenant_id primes the session variable that the
     RLS policies on each table read via current_setting('app.tenant_id', TRUE).
     This is the backstop — if a query accidentally omits the WHERE filter,
     RLS silently returns zero rows instead of leaking data.
"""

from uuid import UUID

import asyncpg
import jwt  # PyJWT — not python-jose
from database import get_pool
from fastapi import Depends, Header, HTTPException, status


async def get_tenant_id(
    authorization: str | None = Header(None),
) -> UUID:
    """
    Decodes the Bearer JWT from the Authorization header.

    Returns the tenant_id claim as a validated UUID object.

    Raises HTTP 401 for every failure mode (missing header, malformed token,
    expired token, wrong secret, missing/invalid tenant_id claim) with
    intentionally generic messages — callers learn nothing about the
    expected token structure from error responses.

    IMPORTANT: tenant_id is ONLY ever sourced from the verified JWT payload.
    It is never read from request bodies, query parameters, or path segments.
    """
    from config import settings  # local import to avoid circular dependency

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=["HS256"],  # explicit allowlist — NEVER derive algorithm from the token
            # header. Accepting the token's claimed alg is a well-documented
            # class of JWT vulnerabilities (e.g. "alg: none" attacks).
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )

    raw_tenant_id = payload.get("tenant_id")
    if not raw_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )
    try:
        return UUID(str(raw_tenant_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )


async def get_connection(
    pool: asyncpg.Pool = Depends(get_pool),
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Acquires a connection from the pool, opens a transaction, and sets the
    RLS session variable for the duration of the request.

    Yields the connection inside an open transaction so SET LOCAL remains
    in scope for the entire request lifetime and expires automatically when
    the transaction commits or rolls back.

    ── WHY STRING INTERPOLATION HERE ────────────────────────────────────────
    PostgreSQL's SET / SET LOCAL commands are configuration directives, not
    parameterizable DML statements. Passing a bind parameter ($1) to SET LOCAL
    raises a syntax error at runtime. Because SET LOCAL does not accept params,
    we must interpolate the value directly into the SQL string.

    This is safe for the following reasons — all three must hold, and all three
    are enforced by the code that precedes this call:
      (a) tenant_id only ever originates from a *verified* JWT payload. An
          attacker who cannot forge our JWT secret cannot influence this value.
      (b) get_tenant_id() above has already validated and constructed a UUID
          object from the raw claim — UUID construction rejects any non-UUID
          string, making injection impossible at the type level.
      (c) str(UUID) produces only the canonical 8-4-4-4-12 hex-dash format.
          No SQL metacharacters (quotes, semicolons, backslashes) can appear
          in this representation.

    The assert below makes invariant (b) explicit so this cannot silently
    degrade if this function is ever refactored to accept tenant_id from
    a different source.
    ─────────────────────────────────────────────────────────────────────────
    """
    assert isinstance(tenant_id, UUID), (
        "tenant_id must be a validated UUID instance before interpolation — "
        "this is a programming error, not a user error."
    )

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(f"SET LOCAL app.tenant_id = '{tenant_id}'")
            yield conn



