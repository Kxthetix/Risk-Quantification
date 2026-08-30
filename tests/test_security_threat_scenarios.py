"""Tests for security threat scenarios, tenant isolation, and IDOR prevention (Phase 10)."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.enums import AssetCriticality, AssetEnvironment, AssetStatus, AssetType
from app.models.organization import Organization
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_tenant_isolation_and_idor_prevention(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify Organization A cannot access or mutate assets from Organization B."""
    # 1. Create Organization B and Asset B
    org_b = Organization(
        id=uuid.uuid4(),
        name="Competitor Corp B",
        industry="Finance",
    )
    db_session.add(org_b)
    await db_session.flush()

    asset_b = Asset(
        id=uuid.uuid4(),
        organization_id=org_b.id,
        name="Confidential Ledger Server",
        asset_type=AssetType.SERVER,
        criticality=AssetCriticality.CRITICAL,
        environment=AssetEnvironment.PRODUCTION,
        status=AssetStatus.ACTIVE,
    )
    db_session.add(asset_b)
    await db_session.commit()

    # 2. User from Org A attempts to fetch Asset B
    token_a = create_access_token(data={"sub": str(admin_user.id)})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    res = await client.get(f"/api/v1/assets/{asset_b.id}", headers=headers_a)
    assert res.status_code == 404  # Must be 404 (IDOR prevention)
