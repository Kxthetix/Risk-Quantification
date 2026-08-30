from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.database import engine, get_db
from app.core.exceptions import register_exception_handlers
from app.core.health import check_liveness, check_readiness, check_startup
from app.core.logging import setup_logging
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.monitoring.metrics import metrics_collector
from app.schemas.common import HealthResponse

# Initialize structured JSON logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events: startup and shutdown."""
    # Startup: Verify database connection if not testing
    if not settings.is_testing:
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as exc:
            print(f"[WARNING] Database connection verification during startup failed: {exc}")
    yield
    # Shutdown: Dispose engine connection pool
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Production-ready enterprise backend for Cybersecurity Risk Assessment, "
        "Financial Impact Analysis, Attack Graph Modeling, and Executive Decision Support (SIH Platform)."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware Pipeline (Executed in reverse order of registration)
# 1. ErrorHandlerMiddleware (outermost - catches all unhandled exceptions)
# 2. SecurityHeadersMiddleware (applies HSTS, CSP, X-Frame-Options)
# 3. CORSMiddleware (enforces explicit origins)
# 4. RequestIdMiddleware (injects & propagates X-Request-ID)
# 5. LoggingMiddleware (logs structured request/response metrics)
# ---------------------------------------------------------------------------
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
)
app.add_middleware(RequestIdMiddleware)
app.add_middleware(LoggingMiddleware)

# Centralized Exception Handlers
register_exception_handlers(app)

# Include API v1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Health Probes & Observability Endpoints
# ---------------------------------------------------------------------------

@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health & Probes"],
    summary="Root Health Check",
)
async def root_health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        app=settings.APP_NAME,
        environment=settings.APP_ENV,
    )


@app.get(
    "/health/live",
    tags=["Health & Probes"],
    summary="Kubernetes Liveness Probe",
    description="Indicates whether the application process is alive and responding.",
)
async def liveness_probe() -> Dict[str, Any]:
    return await check_liveness()


@app.get(
    "/health/ready",
    tags=["Health & Probes"],
    summary="Kubernetes Readiness Probe",
    description="Checks whether backend dependencies (database, storage) are ready to serve live traffic.",
)
async def readiness_probe(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    result = await check_readiness(db)
    if result["status"] != "ready":
        return Response(content=result, status_code=status.HTTP_503_SERVICE_UNAVAILABLE, media_type="application/json")
    return result


@app.get(
    "/health/startup",
    tags=["Health & Probes"],
    summary="Kubernetes Startup Probe",
    description="Checks whether application startup initializers have completed successfully.",
)
async def startup_probe() -> Dict[str, Any]:
    return await check_startup()


@app.get(
    "/metrics",
    tags=["Health & Probes"],
    summary="Prometheus Metrics Exposition",
    description="Prometheus scrapable text exposition format containing HTTP, security, and business metrics.",
)
async def prometheus_metrics() -> Response:
    metrics_text = metrics_collector.generate_prometheus_metrics()
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4; charset=utf-8")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG and not settings.is_production,
    )
