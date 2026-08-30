import uuid
import pytest
from httpx import AsyncClient

from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_get_own_organization(
    client: AsyncClient,
    test_org: Organization,
    viewer_headers: dict,
):
    """Users should be able to view their own organization."""
    response = await client.get(
        f"/api/v1/organizations/{test_org.id}",
        headers=viewer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(test_org.id)
    assert data["name"] == test_org.name


@pytest.mark.asyncio
async def test_get_other_organization_isolation_forbidden(
    client: AsyncClient,
    other_org: Organization,
    viewer_headers: dict,
):
    """Enforce data isolation: accessing another organization's endpoint MUST return 403."""
    response = await client.get(
        f"/api/v1/organizations/{other_org.id}",
        headers=viewer_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "ORGANIZATION_ISOLATION_VIOLATION"


@pytest.mark.asyncio
async def test_update_organization_as_admin(
    client: AsyncClient,
    test_org: Organization,
    admin_headers: dict,
):
    payload = {
        "name": "Alpha Defense Global",
        "description": "Updated global defense ops",
        "industry": "Aerospace & Defense",
    }
    response = await client.put(
        f"/api/v1/organizations/{test_org.id}",
        json=payload,
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Alpha Defense Global"
    assert data["industry"] == "Aerospace & Defense"


@pytest.mark.asyncio
async def test_update_organization_as_manager(
    client: AsyncClient,
    test_org: Organization,
    manager_headers: dict,
):
    payload = {
        "description": "Manager updated description",
    }
    response = await client.put(
        f"/api/v1/organizations/{test_org.id}",
        json=payload,
        headers=manager_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Manager updated description"


@pytest.mark.asyncio
async def test_update_organization_as_viewer_forbidden(
    client: AsyncClient,
    test_org: Organization,
    viewer_headers: dict,
):
    payload = {
        "name": "Hacked Name",
    }
    response = await client.put(
        f"/api/v1/organizations/{test_org.id}",
        json=payload,
        headers=viewer_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INSUFFICIENT_PERMISSIONS"


@pytest.mark.asyncio
async def test_update_other_organization_forbidden(
    client: AsyncClient,
    other_org: Organization,
    admin_headers: dict,
):
    """Admin of Org A cannot update Org B."""
    payload = {
        "name": "Illegal Overwrite",
    }
    response = await client.put(
        f"/api/v1/organizations/{other_org.id}",
        json=payload,
        headers=admin_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "ORGANIZATION_ISOLATION_VIOLATION"
