import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.core.security import create_access_token


@pytest.fixture
def admin_token(test_org, db_session) -> str:
    """Create an administrator account and return their auth bearer token."""
    # Seed an admin user
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        full_name="Alpha Admin",
        email="admin@alpha.com",
        password_hash="hashed_password",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    # Commit changes synchronously in test thread
    import asyncio
    asyncio.get_event_loop().run_until_complete(db_session.commit())
    
    return create_access_token(
        data={"sub": str(user.id), "org": str(test_org.id), "role": UserRole.ADMIN.value}
    )


@pytest.mark.asyncio
async def test_admin_dashboard_kpis(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "active_users_count" in data
    assert "organizations_count" in data
    assert "pending_invitations_count" in data


@pytest.mark.asyncio
async def test_user_invitation(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "email": "invitee@alpha.com",
        "role": "SECURITY_ANALYST",
        "expiration_hours": 48,
        "message": "Welcome to Alpha Security Team",
    }
    response = await client.post("/api/v1/admin/users/invite", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "invitee@alpha.com"
    assert data["role"] == "SECURITY_ANALYST"
    assert data["status"] == "PENDING"


@pytest.mark.asyncio
async def test_roles_and_permissions(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Roles
    res_roles = await client.get("/api/v1/admin/roles", headers=headers)
    assert res_roles.status_code == 200
    assert len(res_roles.json()) > 0
    
    # Role details
    res_role = await client.get("/api/v1/admin/roles/ADMIN", headers=headers)
    assert res_role.status_code == 200
    assert "permissions" in res_role.json()
    
    # Permissions list
    res_perms = await client.get("/api/v1/admin/permissions", headers=headers)
    assert res_perms.status_code == 200
    assert len(res_perms.json()) > 0


@pytest.mark.asyncio
async def test_organizations_management(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = await client.get("/api/v1/admin/organizations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    org_id = data[0]["id"]
    # Suspend org
    res_suspend = await client.post(f"/api/v1/admin/organizations/{org_id}/suspend", headers=headers)
    assert res_suspend.status_code == 200
    
    # Activate org
    res_activate = await client.post(f"/api/v1/admin/organizations/{org_id}/activate", headers=headers)
    assert res_activate.status_code == 200


@pytest.mark.asyncio
async def test_security_policies(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Fetch policies
    response = await client.get("/api/v1/admin/policies", headers=headers)
    assert response.status_code == 200
    policy_data = response.json()
    assert "password_policy" in policy_data
    
    # Update policies
    payload = {
        "password_policy": {
            "min_length": 16,
            "complexity_required": True,
            "expiration_days": 60,
        }
    }
    res_update = await client.put("/api/v1/admin/policies", json=payload, headers=headers)
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["password_policy"]["min_length"] == 16


@pytest.mark.asyncio
async def test_api_keys_management(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create key
    payload = {
        "name": "Production EDR Integration API Key",
        "expiration_days": 90,
    }
    response = await client.post("/api/v1/admin/api-keys", json=payload, headers=headers)
    assert response.status_code == 201
    key_data = response.json()
    assert "secret_key" in key_data
    assert key_data["api_key"]["name"] == "Production EDR Integration API Key"
    
    # List keys
    res_list = await client.get("/api/v1/admin/api-keys", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) > 0
    
    # Revoke key
    key_id = key_data["api_key"]["id"]
    res_revoke = await client.delete(f"/api/v1/admin/api-keys/{key_id}", headers=headers)
    assert res_revoke.status_code == 204


@pytest.mark.asyncio
async def test_integrations_management(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # List integrations
    response = await client.get("/api/v1/admin/integrations", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    # Test connection
    res_test = await client.post("/api/v1/admin/integrations/SIEM/test", headers=headers)
    assert res_test.status_code == 200
    assert res_test.json()["status"] == "CONNECTED"


@pytest.mark.asyncio
async def test_system_diagnostics_and_health(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # System info
    res_system = await client.get("/api/v1/admin/system", headers=headers)
    assert res_system.status_code == 200
    assert "app_version" in res_system.json()
    
    # Health checks
    res_health = await client.get("/api/v1/admin/health", headers=headers)
    assert res_health.status_code == 200
    assert "services" in res_health.json()


@pytest.mark.asyncio
async def test_background_jobs_management(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # List background jobs
    response = await client.get("/api/v1/admin/jobs", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    
    job_id = data[0]["id"]
    
    # Retry job
    res_retry = await client.post(f"/api/v1/admin/jobs/{job_id}/retry", headers=headers)
    assert res_retry.status_code == 200
    
    # Cancel job
    res_cancel = await client.post(f"/api/v1/admin/jobs/{job_id}/cancel", headers=headers)
    assert res_cancel.status_code == 200
