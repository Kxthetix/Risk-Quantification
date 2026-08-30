"""Tests for Software CRUD and Asset-Software relationship management."""
import uuid
import pytest
from httpx import AsyncClient

from app.models.user import User

VALID_SOFTWARE = {
    "vendor": "Apache",
    "product_name": "HTTP Server",
    "product_version": "2.4.49",
    "cpe": "cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
    "architecture": "x86_64",
    "package_manager": "apt",
    "description": "Apache HTTPD web server",
}

VALID_ASSET = {
    "name": "Web Server Alpha",
    "asset_type": "SERVER",
    "hostname": "web-alpha-01",
    "ip_address": "192.168.1.10",
    "environment": "PRODUCTION",
    "criticality": "HIGH",
    "internet_exposed": True,
    "status": "ACTIVE",
}


async def _create_software(client: AsyncClient, headers: dict, payload: dict = None) -> dict:
    response = await client.post("/api/v1/software", json=payload or VALID_SOFTWARE, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


async def _create_asset(client: AsyncClient, headers: dict, payload: dict = None) -> dict:
    response = await client.post("/api/v1/assets", json=payload or VALID_ASSET, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


# ---------------------------------------------------------------------------
# Software CRUD
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_software(client: AsyncClient, analyst_headers: dict):
    response = await client.post("/api/v1/software", json=VALID_SOFTWARE, headers=analyst_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] == "Apache"
    assert data["product_name"] == "HTTP Server"
    assert data["cpe"] == VALID_SOFTWARE["cpe"]
    assert "password" not in data


@pytest.mark.asyncio
async def test_create_software_invalid_cpe(client: AsyncClient, analyst_headers: dict):
    payload = {**VALID_SOFTWARE, "cpe": "not-a-valid-cpe"}
    response = await client.post("/api/v1/software", json=payload, headers=analyst_headers)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_create_software_duplicate(client: AsyncClient, analyst_headers: dict):
    await _create_software(client, analyst_headers)
    response = await client.post("/api/v1/software", json=VALID_SOFTWARE, headers=analyst_headers)
    assert response.status_code == 409
    assert response.json()["error_code"] == "SOFTWARE_ALREADY_EXISTS"


@pytest.mark.asyncio
async def test_create_software_viewer_forbidden(client: AsyncClient, viewer_headers: dict):
    response = await client.post("/api/v1/software", json=VALID_SOFTWARE, headers=viewer_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_software(client: AsyncClient, analyst_headers: dict):
    created = await _create_software(client, analyst_headers)
    response = await client.get(f"/api/v1/software/{created['id']}", headers=analyst_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


@pytest.mark.asyncio
async def test_get_software_not_found(client: AsyncClient, analyst_headers: dict):
    response = await client.get(f"/api/v1/software/{uuid.uuid4()}", headers=analyst_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "SOFTWARE_NOT_FOUND"


@pytest.mark.asyncio
async def test_list_software(client: AsyncClient, analyst_headers: dict):
    await _create_software(client, analyst_headers)
    response = await client.get("/api/v1/software", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert "items" in data


@pytest.mark.asyncio
async def test_list_software_filter_by_vendor(client: AsyncClient, analyst_headers: dict):
    await _create_software(client, analyst_headers)
    # Different vendor
    await _create_software(client, analyst_headers, {
        **VALID_SOFTWARE, "vendor": "Nginx", "product_name": "nginx",
        "product_version": "1.24.0", "cpe": None
    })
    response = await client.get("/api/v1/software?vendor=Apache", headers=analyst_headers)
    assert response.status_code == 200
    for item in response.json()["items"]:
        assert "Apache" in item["vendor"]


@pytest.mark.asyncio
async def test_update_software(client: AsyncClient, analyst_headers: dict):
    created = await _create_software(client, analyst_headers)
    update = {**VALID_SOFTWARE, "product_version": "2.4.58", "cpe": None}
    response = await client.put(f"/api/v1/software/{created['id']}", json=update, headers=analyst_headers)
    assert response.status_code == 200
    assert response.json()["product_version"] == "2.4.58"


@pytest.mark.asyncio
async def test_delete_software(client: AsyncClient, analyst_headers: dict):
    created = await _create_software(client, analyst_headers)
    response = await client.delete(f"/api/v1/software/{created['id']}", headers=analyst_headers)
    assert response.status_code == 204
    get_r = await client.get(f"/api/v1/software/{created['id']}", headers=analyst_headers)
    assert get_r.status_code == 404


@pytest.mark.asyncio
async def test_software_org_isolation(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    created = await _create_software(client, other_org_headers)
    response = await client.get(f"/api/v1/software/{created['id']}", headers=analyst_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "SOFTWARE_NOT_FOUND"


# ---------------------------------------------------------------------------
# Asset-Software Relationships
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_attach_software_to_asset(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)

    payload = {
        "software_id": sw["id"],
        "installed_version": "2.4.49",
        "installation_path": "/usr/sbin/apache2",
        "source": "manual",
        "is_active": True,
    }
    response = await client.post(f"/api/v1/assets/{asset['id']}/software", json=payload, headers=analyst_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["vendor"] == "Apache"
    assert data["installed_version"] == "2.4.49"
    assert data["installation_path"] == "/usr/sbin/apache2"


@pytest.mark.asyncio
async def test_attach_software_duplicate_raises_conflict(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)
    payload = {"software_id": sw["id"], "source": "manual"}
    await client.post(f"/api/v1/assets/{asset['id']}/software", json=payload, headers=analyst_headers)
    response = await client.post(f"/api/v1/assets/{asset['id']}/software", json=payload, headers=analyst_headers)
    assert response.status_code == 409
    assert response.json()["error_code"] == "SOFTWARE_ALREADY_ATTACHED"


@pytest.mark.asyncio
async def test_list_asset_software(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)
    # Attach software
    await client.post(f"/api/v1/assets/{asset['id']}/software",
                      json={"software_id": sw["id"], "source": "manual"},
                      headers=analyst_headers)

    response = await client.get(f"/api/v1/assets/{asset['id']}/software", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["asset_id"] == asset["id"]
    assert data["total"] == 1
    assert data["software"][0]["vendor"] == "Apache"


@pytest.mark.asyncio
async def test_detach_software_from_asset(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)
    await client.post(f"/api/v1/assets/{asset['id']}/software",
                      json={"software_id": sw["id"], "source": "manual"},
                      headers=analyst_headers)

    response = await client.delete(f"/api/v1/assets/{asset['id']}/software/{sw['id']}", headers=analyst_headers)
    assert response.status_code == 204

    # Software record should still exist globally
    sw_response = await client.get(f"/api/v1/software/{sw['id']}", headers=analyst_headers)
    assert sw_response.status_code == 200


@pytest.mark.asyncio
async def test_detach_nonexistent_software_link(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)
    response = await client.delete(f"/api/v1/assets/{asset['id']}/software/{sw['id']}", headers=analyst_headers)
    assert response.status_code == 404
    assert response.json()["error_code"] == "ASSET_SOFTWARE_NOT_FOUND"


@pytest.mark.asyncio
async def test_attach_software_from_other_org_forbidden(
    client: AsyncClient,
    analyst_headers: dict,
    other_org_headers: dict,
):
    """Cannot attach software from another organization to an asset."""
    asset = await _create_asset(client, analyst_headers)
    other_sw = await _create_software(client, other_org_headers)

    payload = {"software_id": other_sw["id"], "source": "manual"}
    response = await client.post(
        f"/api/v1/assets/{asset['id']}/software",
        json=payload,
        headers=analyst_headers,
    )
    assert response.status_code == 404
    assert response.json()["error_code"] == "SOFTWARE_NOT_FOUND"


@pytest.mark.asyncio
async def test_asset_detail_includes_software(client: AsyncClient, analyst_headers: dict):
    asset = await _create_asset(client, analyst_headers)
    sw = await _create_software(client, analyst_headers)
    await client.post(f"/api/v1/assets/{asset['id']}/software",
                      json={"software_id": sw["id"], "installed_version": "2.4.49", "source": "manual"},
                      headers=analyst_headers)

    response = await client.get(f"/api/v1/assets/{asset['id']}", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["software_count"] == 1
    assert data["software"][0]["vendor"] == "Apache"
