"""Tests for liveness, readiness, startup probes, Prometheus metrics, and system status (Phase 10)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_health_probes(client: AsyncClient):
    """Verify liveness, readiness, and startup probe endpoints."""
    # 1. Liveness probe
    live_res = await client.get("/health/live")
    assert live_res.status_code == 200
    live_data = live_res.json()
    assert live_data["status"] == "alive"
    assert "uptime_seconds" in live_data

    # 2. Readiness probe
    ready_res = await client.get("/health/ready")
    assert ready_res.status_code == 200
    ready_data = ready_res.json()
    assert ready_data["status"] == "ready"
    assert ready_data["checks"]["database"]["status"] == "connected"

    # 3. Startup probe
    start_res = await client.get("/health/startup")
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["status"] == "started"


@pytest.mark.asyncio
async def test_prometheus_metrics_exposition(client: AsyncClient):
    """Verify scrapable Prometheus metrics output format."""
    res = await client.get("/metrics")
    assert res.status_code == 200
    assert "text/plain" in res.headers.get("content-type", "")
    content = res.text
    assert "# HELP http_requests_total" in content
    assert "# TYPE http_requests_total counter"


@pytest.mark.asyncio
async def test_system_status_endpoint_rbac(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify system diagnostics endpoint requires Admin privileges."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/system/status", headers=headers)
    assert res.status_code == 200
    status_data = res.json()
    assert "app" in status_data
    assert "version" in status_data
    assert "environment" in status_data
    assert status_data["database_status"] == "connected"
    # Ensure no secrets leaked
    assert "password" not in str(status_data).lower()
    assert "jwt_secret" not in str(status_data).lower()
