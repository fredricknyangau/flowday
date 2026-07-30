import asyncio
from contextlib import asynccontextmanager

import asyncpg
from config import settings
from database import close_pool, get_pool
from dependencies import get_tenant_id
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from modules.assignments.router import router as assignments_router
from modules.auth.router import router as auth_router
from modules.burnout.router import router as burnout_router
from modules.clients.router import router as clients_router
from modules.push.router import router as push_router
from modules.push.tasks import run_push_notification_worker
from modules.schedule.router import router as schedule_router

_push_task = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_pool()
    try:
        from scripts.migrate import run_migrations
        await run_migrations()
    except Exception as e:
        print(f"Migration runner notice: {e}")

    global _push_task
    _push_task = asyncio.create_task(run_push_notification_worker())
    yield
    # Shutdown
    if _push_task:
        _push_task.cancel()
    await close_pool()


app = FastAPI(
    title="Flowday API",
    description="Backend for the Flowday day planning system",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip().rstrip("/") for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authenticated routers — all requests require a valid Bearer JWT.
app.include_router(clients_router,     prefix="/api/v1/clients",     tags=["clients"],     dependencies=[Depends(get_tenant_id)])
app.include_router(assignments_router, prefix="/api/v1/assignments", tags=["assignments"], dependencies=[Depends(get_tenant_id)])
app.include_router(schedule_router,    prefix="/api/v1/schedule",    tags=["schedule"],    dependencies=[Depends(get_tenant_id)])
app.include_router(burnout_router,     prefix="/api/v1/burnout",     tags=["burnout"],     dependencies=[Depends(get_tenant_id)])
app.include_router(push_router,        prefix="/api/v1/push",        tags=["push"],        dependencies=[Depends(get_tenant_id)])

# Auth router — handles workspace registration, login, and profile info
app.include_router(auth_router,        prefix="/api/v1/auth",        tags=["auth"])


# ── Global exception handlers ──────────────────────────────────────────────────

def _error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": True, "message": message, "detail": None},
    )


@app.exception_handler(asyncpg.ForeignKeyViolationError)
async def foreign_key_handler(request: Request, exc: asyncpg.ForeignKeyViolationError):
    return _error_response(400, "Invalid reference — the related record does not exist")


@app.exception_handler(asyncpg.UniqueViolationError)
async def unique_violation_handler(request: Request, exc: asyncpg.UniqueViolationError):
    return _error_response(409, "A record with this value already exists")


@app.exception_handler(asyncpg.CheckViolationError)
async def check_violation_handler(request: Request, exc: asyncpg.CheckViolationError):
    return _error_response(400, "Value is not allowed for this field")


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    import logging
    import traceback
    logging.getLogger(__name__).error(
        "Unhandled exception on %s %s\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return _error_response(500, "An unexpected error occurred.")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    db_status = "connected"
    overall = "ok"
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Use to_regclass() instead of COUNT(*) on a tenant-scoped table:
            # COUNT(*) on schedule_blocks would be blocked by RLS (app.tenant_id
            # is not set on this unauthenticated probe connection), causing a
            # confusing "degraded" status. to_regclass() hits the catalog, not
            # a RLS-protected table, and returns NULL if the table doesn't exist.
            result = await conn.fetchval("SELECT to_regclass('schedule_blocks')")
            if result is None:
                db_status = "missing_tables"
                overall = "degraded"
    except Exception:
        db_status = "unreachable"
        overall = "degraded"

    return {
        "status": overall,
        "service": "flowday-api",
        "database": db_status,
        "environment": settings.environment,
        "allowed_origins": settings.allowed_origins,
    }
