import pytest
from httpx import AsyncClient

from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_list_users_in_organization(
    client: AsyncClient,
    admin_user: User,
    analyst_user: User,
    viewer_user: User,
    admin_headers: dict,
):
    response = await client.get("/api/v1/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    emails = [u["email"] for u in data]
    assert admin_user.email in emails
    assert analyst_user.email in emails
    assert viewer_user.email in emails


@pytest.mark.asyncio
async def test_get_user_same_org(
    client: AsyncClient,
    analyst_user: User,
    viewer_headers: dict,
):
    response = await client.get(
        f"/api/v1/users/{analyst_user.id}",
        headers=viewer_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(analyst_user.id)
    assert data["email"] == analyst_user.email


@pytest.mark.asyncio
async def test_get_user_cross_org_forbidden(
    client: AsyncClient,
    other_org_user: User,
    viewer_headers: dict,
):
    response = await client.get(
        f"/api/v1/users/{other_org_user.id}",
        headers=viewer_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "ORGANIZATION_ISOLATION_VIOLATION"


@pytest.mark.asyncio
async def test_admin_create_user(
    client: AsyncClient,
    admin_headers: dict,
):
    payload = {
        "full_name": "New SOC Analyst",
        "email": "soc.analyst@alpha.com",
        "password": "Password12345!",
        "role": "SECURITY_ANALYST",
    }
    response = await client.post(
        "/api/v1/users",
        json=payload,
        headers=admin_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "soc.analyst@alpha.com"
    assert data["role"] == "SECURITY_ANALYST"
    assert data["is_active"] is True
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_viewer_create_user_forbidden(
    client: AsyncClient,
    viewer_headers: dict,
):
    payload = {
        "full_name": "Unauthorized User",
        "email": "unauth@alpha.com",
        "password": "Password12345!",
        "role": "VIEWER",
    }
    response = await client.post(
        "/api/v1/users",
        json=payload,
        headers=viewer_headers,
    )
    assert response.status_code == 403
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INSUFFICIENT_ROLE_PERMISSIONS"


@pytest.mark.asyncio
async def test_admin_update_user(
    client: AsyncClient,
    viewer_user: User,
    admin_headers: dict,
):
    payload = {
        "role": "MANAGER",
        "is_active": True,
    }
    response = await client.put(
        f"/api/v1/users/{viewer_user.id}",
        json=payload,
        headers=admin_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "MANAGER"
