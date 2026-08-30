"""Tests for authentication hardening, refresh tokens, session tracking, and logout (Phase 10)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_auth_login_issues_refresh_token_and_rotation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify login provides access and refresh tokens, and refresh rotates tokens."""
    # 1. Login with valid credentials
    login_payload = {
        "email": admin_user.email,
        "password": "ValidPassword123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    tokens = login_res.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    access_token_1 = tokens["access_token"]
    refresh_token_1 = tokens["refresh_token"]

    # 2. Use refresh token to obtain a new pair
    refresh_payload = {"refresh_token": refresh_token_1}
    refresh_res = await client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert refresh_res.status_code == 200
    new_tokens = refresh_res.json()
    access_token_2 = new_tokens["access_token"]
    refresh_token_2 = new_tokens["refresh_token"]

    assert access_token_2 != access_token_1
    assert refresh_token_2 != refresh_token_1

    # 3. Attempt replay of old rotated refresh token (Must fail with 401)
    replay_res = await client.post("/api/v1/auth/refresh", json=refresh_payload)
    assert replay_res.status_code == 401
    assert "SESSION_REVOKED" in replay_res.text or "revoked" in replay_res.text.lower()


@pytest.mark.asyncio
async def test_auth_session_management_and_logout(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify user sessions listing and logout session invalidation."""
    # 1. Login
    login_payload = {
        "email": admin_user.email,
        "password": "ValidPassword123!",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    tokens = login_res.json()
    auth_headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    refresh_token = tokens["refresh_token"]

    # 2. List sessions
    sessions_res = await client.get("/api/v1/auth/sessions", headers=auth_headers)
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    assert len(sessions) >= 1
    session_id = sessions[0]["id"]
    assert sessions[0]["revoked"] is False

    # 3. Logout
    logout_res = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers=auth_headers,
    )
    assert logout_res.status_code == 200

    # 4. Verify refresh token is now revoked
    refresh_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refresh_res.status_code == 401
