"""Tests for Asset CRUD, filtering, search, statistics, and organization isolation."""
import uuid
import pytest
from httpx import AsyncClient

from app.models.enums import AssetCriticality, AssetEnvironment, AssetStatus, AssetType
from app.models.organization import Organization
from app.models.user import User


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

VALID_ASSET_PAYLOAD = {
    "name": "Production Web Server",
    "description": "Main customer-facing application server",
    "asset_type": "SERVER",
    "hostname": "prod-web-01",
    "ip_address": "10.10.1.20",
    "mac_address": "00:11:22:33:44:55",
    "operating_system": "Ubuntu",
    "os_version": "22.04",
    "environment": "PRODUCTION",
    "criticality": "CRITICAL",
    "business_value": 500000,
    "data_classification": "CONFIDENTIAL",
    "internet_exposed": True,
    "status": "ACTIVE",
    "location": "Chennai Data Center",
    "owner": "IT Operations",
}


async def _create_asset(client: AsyncClient, headers: dict, payload: dict = None) -> dict:
    response = await client.post("/api/v1/assets", json=payload or VALID_ASSET_PAYLOAD, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------------------------------------------------------------------------
# Create Asset
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_asset_as_analyst(client: AsyncClient, analyst_user: User, analyst_headers: dict):
    response = await client.post("/api/v1/assets", json=VALID_ASSET_PAYLOAD, headers=analyst_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == VALID_ASSET_PAYLOAD["name"]
    assert data["asset_type"] == "SERVER"
    assert data["criticality"] == "CRITICAL"
    assert data["internet_exposed"] is True
    assert data["organization_id"] == str(analyst_user.organization_id)
    assert "id" in data
    assert "created_at" in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_create_asset_viewer_forbidden(client: AsyncClient, viewer_headers: dict):
    response = await client.post("/api/v1/assets", json=VALID_ASSET_PAYLOAD, headers=viewer_headers)
    assert response.status_code == 403
    assert response.json()["error_code"] == "INSUFFICIENT_PERMISSIONS"


@pytest.mark.asyncio
async def test_create_asset_unauthenticated(client: AsyncClient):
    response = await client.post("/api/v1/assets", json=VALID_ASSET_PAYLOAD)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_asset_invalid_ip(client: AsyncClient, analyst_headers: dict):
    payload = {**VALID_ASSET_PAYLOAD, "hostname": "unique-host-1", "ip_address": "999.999.999.999"}
    response = await client.post("/api/v1/assets", json=payload, headers=analyst_headers)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_create_asset_negative_business_value(client: AsyncClient, analyst_headers: dict):
    payload = {**VALID_ASSET_PAYLOAD, "hostname": "unique-host-2", "business_value": -100}
    response = await client.post("/api/v1/assets", json=payload, headers=analyst_headers)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_create_asset_invalid_enum(client: AsyncClient, analyst_headers: dict):
    payload = {**VALID_ASSET_PAYLOAD, "asset_type": "INVALID_TYPE"}
    response = await client.post("/api/v1/assets", json=payload, headers=analyst_headers)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_asset_duplicate_hostname(client: AsyncClient, analyst_headers: dict):
    """Same hostname cannot be used twice within an organization."""
    await _create_asset(client, analyst_headers)
    response = await client.post("/api/v1/assets", json=VALID_ASSET_PAYLOAD, headers=analyst_headers)
    assert response.status_code == 409
    assert response.json()["error_code"] == "ASSET_HOSTNAME_DUPLICATE"


@pytest.mark.asyncio
async def test_create_asset_missing_required_field(client: AsyncClient, analyst_headers: dict):
    payload = {"description": "Missing name and type"}
    response = await client.post("/api/v1/assets", json=payload, headers=analyst_headers)
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Get & List
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_asset(client: AsyncClient, analyst_headers: dict):
    created = await _create_asset(client, analyst_headers)
    response = await client.get(f"/api/v1/assets/{created['id']}", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created["id"]
    assert "software" in data
    assert "software_count" in data


@pytest.mark.asyncio
async def test_get_asset_not_found(client: AsyncClient, analyst_headers: dict):
    response = await client.get(f"/api/v1/assets/{uuid.uuid4()}", headers=analyst_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "ASSET_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_assets_returns_only_own_org(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    # Create asset in org A
    await _create_asset(client, analyst_headers)
    # Create asset in org B
    await _create_asset(client, other_org_headers, {**VALID_ASSET_PAYLOAD, "hostname": "other-host-01"})

    # Org A can only see its own assets
    response = await client.get("/api/v1/assets", headers=analyst_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == VALID_ASSET_PAYLOAD["name"]


@pytest.mark.asyncio
async def test_list_assets_pagination(client: AsyncClient, analyst_headers: dict):
    # Create 3 assets
    for i in range(3):
        await _create_asset(client, analyst_headers, {**VALID_ASSET_PAYLOAD, "hostname": f"host-pg-{i}", "name": f"Asset {i}"})

    response = await client.get("/api/v1/assets?page=1&limit=2", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 2
    assert len(data["items"]) == 2
    assert data["total"] == 3


@pytest.mark.asyncio
async def test_list_assets_filter_by_type(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    await _create_asset(client, analyst_headers, {
        **VALID_ASSET_PAYLOAD, "hostname": "db-host-01", "name": "DB Server", "asset_type": "DATABASE"
    })
    response = await client.get("/api/v1/assets?asset_type=DATABASE", headers=analyst_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["asset_type"] == "DATABASE"


@pytest.mark.asyncio
async def test_list_assets_filter_by_internet_exposed(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    await _create_asset(client, analyst_headers, {
        **VALID_ASSET_PAYLOAD, "hostname": "internal-db", "name": "DB Server",
        "internet_exposed": False, "asset_type": "DATABASE"
    })
    response = await client.get("/api/v1/assets?internet_exposed=true", headers=analyst_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(item["internet_exposed"] is True for item in items)


@pytest.mark.asyncio
async def test_list_assets_filter_by_criticality(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    await _create_asset(client, analyst_headers, {
        **VALID_ASSET_PAYLOAD, "hostname": "low-host", "name": "Low Asset", "criticality": "LOW"
    })
    response = await client.get("/api/v1/assets?criticality=CRITICAL", headers=analyst_headers)
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert item["criticality"] == "CRITICAL"


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_search_assets_by_name(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    response = await client.get("/api/v1/assets/search?q=Production", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Production" in item["name"] for item in data["items"])


@pytest.mark.asyncio
async def test_search_assets_by_hostname(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    response = await client.get("/api/v1/assets/search?q=prod-web", headers=analyst_headers)
    assert response.status_code == 200
    assert response.json()["total"] >= 1


@pytest.mark.asyncio
async def test_search_assets_no_cross_org_results(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    await _create_asset(client, other_org_headers, {**VALID_ASSET_PAYLOAD, "hostname": "unique-other"})
    response = await client.get("/api/v1/assets/search?q=Production", headers=analyst_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 0


# ---------------------------------------------------------------------------
# Update & Patch
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_asset_put(client: AsyncClient, analyst_headers: dict):
    created = await _create_asset(client, analyst_headers)
    update_payload = {**VALID_ASSET_PAYLOAD, "name": "Updated Server", "business_value": 750000}
    response = await client.put(f"/api/v1/assets/{created['id']}", json=update_payload, headers=analyst_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Server"
    assert response.json()["business_value"] == 750000


@pytest.mark.asyncio
async def test_patch_asset(client: AsyncClient, manager_headers: dict, analyst_headers: dict):
    created = await _create_asset(client, analyst_headers)
    patch_payload = {"status": "MAINTENANCE", "owner": "Ops Team"}
    response = await client.patch(f"/api/v1/assets/{created['id']}", json=patch_payload, headers=manager_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "MAINTENANCE"
    assert response.json()["owner"] == "Ops Team"


@pytest.mark.asyncio
async def test_viewer_cannot_patch_asset(client: AsyncClient, analyst_headers: dict, viewer_headers: dict):
    created = await _create_asset(client, analyst_headers)
    response = await client.patch(f"/api/v1/assets/{created['id']}", json={"status": "INACTIVE"}, headers=viewer_headers)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_asset(client: AsyncClient, analyst_headers: dict):
    created = await _create_asset(client, analyst_headers)
    response = await client.delete(f"/api/v1/assets/{created['id']}", headers=analyst_headers)
    assert response.status_code == 204
    # Verify it's gone
    get_response = await client.get(f"/api/v1/assets/{created['id']}", headers=analyst_headers)
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_viewer_cannot_delete_asset(client: AsyncClient, analyst_headers: dict, viewer_headers: dict):
    created = await _create_asset(client, analyst_headers)
    response = await client.delete(f"/api/v1/assets/{created['id']}", headers=viewer_headers)
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Statistics
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_asset_statistics(client: AsyncClient, analyst_headers: dict):
    await _create_asset(client, analyst_headers)
    await _create_asset(client, analyst_headers, {
        **VALID_ASSET_PAYLOAD, "hostname": "db-stat-01", "name": "DB Asset",
        "asset_type": "DATABASE", "internet_exposed": False
    })
    response = await client.get("/api/v1/assets/statistics", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_assets"] == 2
    assert data["active_assets"] == 2
    assert data["servers"] == 1
    assert data["databases"] == 1
    assert data["internet_exposed_assets"] == 1
    assert "by_type" in data
    assert "by_criticality" in data


# ---------------------------------------------------------------------------
# Organization Isolation — Critical Security Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_org_isolation_cannot_view_other_org_asset(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    """Org A analyst CANNOT access Org B assets."""
    created = await _create_asset(client, other_org_headers, {**VALID_ASSET_PAYLOAD, "hostname": "other-sec"})
    response = await client.get(f"/api/v1/assets/{created['id']}", headers=analyst_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "ASSET_NOT_FOUND"


@pytest.mark.asyncio
async def test_org_isolation_cannot_update_other_org_asset(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    created = await _create_asset(client, other_org_headers, {**VALID_ASSET_PAYLOAD, "hostname": "other-upd"})
    response = await client.put(
        f"/api/v1/assets/{created['id']}",
        json=VALID_ASSET_PAYLOAD,
        headers=analyst_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_org_isolation_cannot_delete_other_org_asset(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    created = await _create_asset(client, other_org_headers, {**VALID_ASSET_PAYLOAD, "hostname": "other-del"})
    response = await client.delete(f"/api/v1/assets/{created['id']}", headers=analyst_headers)
    assert response.status_code == 404
