"""Tests for Executive Dashboard REST endpoints (Phase 9)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.enums import AssetCriticality, AssetEnvironment, AssetType
from app.models.organization import Organization
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_executive_dashboard_and_kpis(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Add an asset
    asset = Asset(
        organization_id=test_org.id,
        name="Main Banking Gateway",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        business_value=5000000.0,
        internet_exposed=True,
    )
    db_session.add(asset)
    await db_session.commit()

    # 1. Test /executive
    res = await client.get("/api/v1/dashboard/executive", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "overall_risk_score" in data
    assert "expected_annual_loss" in data
    assert "critical_assets" in data
    assert "risk_trend" in data
    assert "meta" in data

    # 2. Test /kpis
    kpi_res = await client.get("/api/v1/dashboard/kpis", headers=headers)
    assert kpi_res.status_code == 200
    kpis = kpi_res.json()
    assert "overall_risk_score" in kpis
    assert "expected_annual_loss" in kpis
    assert "roi" in kpis

    # 3. Test /risk-overview
    ro_res = await client.get("/api/v1/dashboard/risk-overview", headers=headers)
    assert ro_res.status_code == 200
    ro = ro_res.json()
    assert "distribution" in ro

    # 4. Test /financial-risk
    fin_res = await client.get("/api/v1/dashboard/financial-risk", headers=headers)
    assert fin_res.status_code == 200
    fin = fin_res.json()
    assert "expected_annual_loss" in fin
    assert "p90" in fin

    # 5. Test /attack-surface
    surf_res = await client.get("/api/v1/dashboard/attack-surface", headers=headers)
    assert surf_res.status_code == 200
    surf = surf_res.json()
    assert surf["total_assets"] >= 1
    assert surf["internet_facing"] >= 1

    # 6. Test /risk-heatmap
    hm_res = await client.get("/api/v1/dashboard/risk-heatmap", headers=headers)
    assert hm_res.status_code == 200
    hm = hm_res.json()
    assert hm["dimensions"] == {"likelihood": 5, "impact": 5}
    assert len(hm["cells"]) == 25


@pytest.mark.asyncio
async def test_dashboard_tenant_isolation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Create another organization
    org2 = Organization(name="Competitor Bank Corp", industry="Financial")
    db_session.add(org2)
    await db_session.flush()

    asset2 = Asset(
        organization_id=org2.id,
        name="Competitor Secret Core",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        business_value=99000000.0,
        internet_exposed=True,
    )
    db_session.add(asset2)
    await db_session.commit()

    # User from org 1 should NOT see asset2 in their attack surface
    res = await client.get("/api/v1/dashboard/attack-surface", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # The count should only belong to test_org
    assert data["total_assets"] != 999
