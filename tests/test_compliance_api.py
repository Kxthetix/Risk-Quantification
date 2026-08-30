"""Backend tests for Compliance & Security Controls APIs (Phase 8)."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.organization import Organization
from app.models.user import User


@pytest.mark.asyncio
async def test_compliance_summary_api(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify executive compliance summary endpoint returns KPIs."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/compliance/summary", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "overall_compliance_pct" in data
    assert "control_coverage_pct" in data
    assert "total_controls" in data
    assert data["total_controls"] >= 90
    assert data["total_compliance_risk_exposure"] > 0


@pytest.mark.asyncio
async def test_compliance_frameworks_api(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify framework catalog retrieval."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/compliance/frameworks", headers=headers)
    assert res.status_code == 200
    frameworks = res.json()
    assert len(frameworks) >= 4
    iso = next((f for f in frameworks if "ISO" in f["name"]), None)
    assert iso is not None
    assert iso["compliance_pct"] > 0


@pytest.mark.asyncio
async def test_iso_27001_framework_detail_and_clauses(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify ISO 27001 framework detail and clause breakdown."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/compliance/frameworks/iso-27001-2022", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "ISO/IEC 27001"
    assert len(data["clauses"]) >= 4
    annex_a = next((c for c in data["clauses"] if "Annex A.8" in c["clause_id"]), None)
    assert annex_a is not None


@pytest.mark.asyncio
async def test_framework_controls_and_detail(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify framework mapped controls and single control detail."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/compliance/frameworks/iso-27001-2022/controls", headers=headers)
    assert res.status_code == 200
    controls = res.json()
    assert len(controls) >= 3

    ctrl_res = await client.get("/api/v1/compliance/controls/ctrl-a8-20", headers=headers)
    assert ctrl_res.status_code == 200
    ctrl = ctrl_res.json()
    assert ctrl["code"] == "A.8.20"
    assert len(ctrl["framework_mappings"]) >= 2
    assert len(ctrl["mapped_assets"]) >= 1


@pytest.mark.asyncio
async def test_compliance_cyber_risk_map_api(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify multi-tier compliance requirement to cyber-risk chain."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.get("/api/v1/compliance/risk-map", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "chains" in data
    assert len(data["chains"]) >= 2
    first_chain = data["chains"][0]
    assert "requirement" in first_chain
    assert "control_code" in first_chain
    assert "attack_path_name" in first_chain
    assert "financial_impact" in first_chain
