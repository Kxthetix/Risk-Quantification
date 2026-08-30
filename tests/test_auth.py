from datetime import timedelta
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


@pytest.mark.asyncio
async def test_successful_registration(client: AsyncClient):
    payload = {
        "full_name": "Cyber Engineer",
        "email": "engineer@cyberrisk.io",
        "password": "StrongPassword999!",
        "organization_name": "Cyber Defense Inc",
        "industry": "Cybersecurity",
        "description": "Risk and compliance division",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "engineer@cyberrisk.io"
    assert data["full_name"] == "Cyber Engineer"
    assert data["role"] == "ADMIN"
    assert data["is_active"] is True
    assert "id" in data
    assert "organization_id" in data
    # Ensure sensitive fields are NEVER leaked
    assert "password" not in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_registration_duplicate_email(client: AsyncClient, admin_user: User):
    payload = {
        "full_name": "Imposter Admin",
        "email": admin_user.email,  # Already existing email
        "password": "StrongPassword999!",
        "organization_name": "Another Corp",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "EMAIL_ALREADY_REGISTERED"


@pytest.mark.asyncio
async def test_registration_invalid_email(client: AsyncClient):
    payload = {
        "full_name": "Invalid Email User",
        "email": "not-an-email",
        "password": "StrongPassword999!",
        "organization_name": "Tech Corp",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_registration_weak_password(client: AsyncClient):
    payload = {
        "full_name": "Weak Pass User",
        "email": "weak@example.com",
        "password": "short",  # Less than 8 chars
        "organization_name": "Tech Corp",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_registration_missing_fields(client: AsyncClient):
    payload = {
        "email": "missingfields@example.com",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    payload = {
        "email": admin_user.email,
        "password": "AdminPass123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0


@pytest.mark.asyncio
async def test_login_incorrect_password(client: AsyncClient, admin_user: User):
    payload = {
        "email": admin_user.email,
        "password": "WrongPassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_unknown_email(client: AsyncClient):
    payload = {
        "email": "nonexistent@cyberrisk.io",
        "password": "SomePassword123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_login_inactive_user(client: AsyncClient, admin_user: User, db_session):
    admin_user.is_active = False
    await db_session.commit()

    payload = {
        "email": admin_user.email,
        "password": "AdminPass123!",
    }
    response = await client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "INACTIVE_USER"


@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient, admin_user: User, admin_headers: dict):
    response = await client.get("/api/v1/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(admin_user.id)
    assert data["email"] == admin_user.email
    assert data["role"] == "ADMIN"
    assert data["organization_id"] == str(admin_user.organization_id)
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_get_me_missing_token(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "TOKEN_MISSING"


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    headers = {"Authorization": "Bearer malformed.invalid.token"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "TOKEN_INVALID"


@pytest.mark.asyncio
async def test_get_me_expired_token(client: AsyncClient, admin_user: User):
    expired_token = create_access_token(
        {
            "sub": str(admin_user.id),
            "organization_id": str(admin_user.organization_id),
            "role": admin_user.role.value,
        },
        expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "TOKEN_EXPIRED"
