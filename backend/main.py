from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import get_pool, close_pool
from modules.clients.router import router as clients_router
from modules.assignments.router import router as assignments_router
from modules.schedule.router import router as schedule_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    await get_pool()
    yield
    # shutdown
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

app.include_router(clients_router,     prefix="/api/v1/clients",     tags=["clients"])
app.include_router(assignments_router, prefix="/api/v1/assignments", tags=["assignments"])
app.include_router(schedule_router,    prefix="/api/v1/schedule",    tags=["schedule"])


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
    import traceback
    traceback.print_exc()
    return _error_response(500, f"An unexpected error occurred: {str(exc)}")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    db_status = "connected"
    overall = "ok"
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT count(*) FROM schedule_blocks")
    except asyncpg.exceptions.UndefinedTableError:
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
