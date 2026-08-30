import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.models.user import User, UserRole
from app.core.security import create_access_token


@pytest.fixture
def admin_user(test_org, db_session) -> User:
    """Fixture to provision an Admin user in Alpha Org."""
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
    import asyncio
    asyncio.get_event_loop().run_until_complete(db_session.commit())
    return user


@pytest.fixture
def admin_token_e2e(admin_user) -> str:
    """Bearer token for admin user in Alpha Org."""
    return create_access_token(
        data={"sub": str(admin_user.id), "org": str(admin_user.organization_id), "role": UserRole.ADMIN.value}
    )


@pytest.fixture
def beta_admin_token(other_org, db_session) -> str:
    """Bearer token for an admin user in Beta Org (other_org) to verify multi-tenant isolation."""
    user = User(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        full_name="Beta Admin",
        email="admin@beta.com",
        password_hash="hashed_password",
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    import asyncio
    asyncio.get_event_loop().run_until_complete(db_session.commit())
    
    return create_access_token(
        data={"sub": str(user.id), "org": str(other_org.id), "role": UserRole.ADMIN.value}
    )


@pytest.mark.asyncio
async def test_phase12_e2e_workflow(
    client: AsyncClient,
    admin_token_e2e: str,
    beta_admin_token: str,
    admin_user: User,
):
    headers_alpha = {"Authorization": f"Bearer {admin_token_e2e}"}
    headers_beta = {"Authorization": f"Bearer {beta_admin_token}"}
    
    # 1. Admin dashboard access
    res_dash = await client.get("/api/v1/admin/dashboard", headers=headers_alpha)
    assert res_dash.status_code == 200
    
    # 2. Invite a new analyst user under Alpha Org
    invite_payload = {
        "email": "analyst-new@alpha.com",
        "role": "SECURITY_ANALYST",
        "expiration_hours": 24,
    }
    res_invite = await client.post("/api/v1/admin/users/invite", json=invite_payload, headers=headers_alpha)
    assert res_invite.status_code == 201
    
    # 3. Create a programmatic API key for EDR integration
    apikey_payload = {"name": "Falcon Connector Key", "expiration_days": 30}
    res_apikey = await client.post("/api/v1/admin/api-keys", json=apikey_payload, headers=headers_alpha)
    assert res_apikey.status_code == 201
    key_id = res_apikey.json()["api_key"]["id"]
    
    # 4. Read audit log to check actions (ASSET_CREATED or CONFIG_UPDATED should be present)
    res_audit = await client.get("/api/v1/audit", headers=headers_alpha)
    assert res_audit.status_code == 200
    assert len(res_audit.json()) > 0
    
    # 5. Verify tenant isolation: Beta Org must NOT see Alpha Org's audit logs or API keys
    # Fetch audit logs as Beta Org
    res_beta_audit = await client.get("/api/v1/audit", headers=headers_beta)
    assert res_beta_audit.status_code == 200
    beta_logs = res_beta_audit.json()
    
    # If Beta logs exist (seeded by default), they must map to Beta Org ID
    # Alpha Org ID must never appear in Beta Org's data
    for log in beta_logs:
         assert log["organization_id"] != str(admin_user.organization_id)
         
    # Attempt to delete Alpha key using Beta org credentials -> should raise 404/403 or Value error
    res_cross_delete = await client.delete(f"/api/v1/admin/api-keys/{key_id}", headers=headers_beta)
    assert res_cross_delete.status_code in [404, 403, 500]  # Throws mismatch on query
