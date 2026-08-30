"""Tests for RequestId, SecurityHeaders, and ErrorHandler middleware (Phase 10)."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    """Verify standard OWASP security headers are present on all responses."""
    res = await client.get("/health")
    assert res.status_code == 200

    headers = res.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "Content-Security-Policy" in headers
    assert "Permissions-Policy" in headers


@pytest.mark.asyncio
async def test_request_id_generation_and_propagation(client: AsyncClient):
    """Verify X-Request-ID is generated and returned, or propagated if supplied."""
    # 1. Automatic generation
    res1 = await client.get("/health")
    assert res1.status_code == 200
    req_id_1 = res1.headers.get("X-Request-ID")
    assert req_id_1 is not None
    assert len(req_id_1) > 0

    # 2. Custom upstream propagation
    custom_id = "test-upstream-trace-id-12345"
    res2 = await client.get("/health", headers={"X-Request-ID": custom_id})
    assert res2.status_code == 200
    assert res2.headers.get("X-Request-ID") == custom_id


@pytest.mark.asyncio
async def test_error_handler_masks_internal_details(client: AsyncClient):
    """Verify unhandled 404 or bad requests return standardized JSON without traceback leakage."""
    res = await client.get("/api/v1/nonexistent-route-999")
    assert res.status_code == 404
    data = res.json()
    assert data["success"] is False
    assert "error" in data
    assert "traceback" not in str(data).lower()
    assert "password" not in str(data).lower()
