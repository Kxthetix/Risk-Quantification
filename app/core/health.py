"""Health check probes and system diagnostics (Phase 10)."""
from datetime import datetime, timezone
import time
from typing import Any, Dict

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import engine

START_TIME = time.time()


async def check_liveness() -> Dict[str, Any]:
    """Liveness probe: returns whether the Python application process is running."""
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": round(time.time() - START_TIME, 2),
    }


async def check_readiness(db: AsyncSession) -> Dict[str, Any]:
    """Readiness probe: verifies dependencies required to serve production traffic."""
    checks: Dict[str, Any] = {}
    is_ready = True

    # 1. Database Connectivity Probe
    try:
        t0 = time.time()
        await db.execute(text("SELECT 1"))
        latency_ms = round((time.time() - t0) * 1000, 2)
        checks["database"] = {
            "status": "connected",
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        is_ready = False
        checks["database"] = {
            "status": "disconnected",
            "error": "Database probe failed",
        }

    # 2. Redis Cache Probe (Optional / Soft-degraded)
    checks["redis"] = {
        "status": "configured" if settings.REDIS_URL else "not_configured",
    }

    # 3. Overall Readiness
    return {
        "status": "ready" if is_ready else "not_ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": checks,
    }


async def check_startup() -> Dict[str, Any]:
    """Startup probe: verifies that application initializers and configs are loaded."""
    return {
        "status": "started",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


async def get_system_status(db: AsyncSession) -> Dict[str, Any]:
    """Administrative system diagnostics without leaking sensitive credentials."""
    readiness = await check_readiness(db)
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "status": "operational" if readiness["status"] == "ready" else "degraded",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "database_status": readiness["checks"]["database"]["status"],
        "rate_limiting_enabled": settings.RATE_LIMIT_ENABLED,
        "security_headers_enabled": settings.SECURITY_HEADERS_ENABLED,
        "prometheus_metrics_enabled": settings.PROMETHEUS_METRICS_ENABLED,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
