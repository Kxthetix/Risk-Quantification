import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.common import DatabaseHealthResponse, HealthResponse

router = APIRouter(tags=["Health Check"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Health Status",
    description="Returns the operational status of the API application.",
)
async def get_app_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        environment=settings.APP_ENV,
    )


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    summary="Database Health & Connectivity Check",
    description="Executes a live query to verify PostgreSQL database connectivity and measures round-trip latency.",
)
async def get_database_health(db: AsyncSession = Depends(get_db)) -> DatabaseHealthResponse:
    start_time = time.perf_counter()
    try:
        result = await db.execute(text("SELECT 1"))
        _ = result.scalar()
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return DatabaseHealthResponse(
            status="healthy",
            database="connected",
            latency_ms=elapsed_ms,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}",
        )
