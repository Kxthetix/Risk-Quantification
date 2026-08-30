"""Integration tests for Phase 6 Financial Impact & Simulation APIs."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AssetVulnerabilityStatus,
    DataClassification,
    ExploitAvailability,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.organization import Organization
from app.models.risk_assessment import RiskAssessment
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_financial_profile_crud_and_derived_values(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test getting, creating, and updating financial profile with derived revenues."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get default profile
    get_res = await client.get("/api/v1/financial/profile", headers=headers)
    assert get_res.status_code == 200
    prof = get_res.json()
    assert prof["currency"] == "INR"
    assert prof["hourly_revenue"] > 0

    # 2. Update annual revenue & working days
    put_res = await client.put(
        "/api/v1/financial/profile",
        json={
            "annual_revenue": 200000000.0,
            "operating_days_per_year": 250,
            "hours_per_day": 8,
            "employee_count": 250,
            "average_hourly_employee_cost": 500.0,
        },
        headers=headers,
    )
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["annual_revenue"] == 200000000.0
    # Expected daily: 200,000,000 / 250 = 800,000
    assert updated["daily_revenue"] == 800000.0
    # Expected hourly: 800,000 / 8 = 100,000
    assert updated["hourly_revenue"] == 100000.0


@pytest.mark.asyncio
async def test_business_services_api(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Create and list business services."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    create_res = await client.post(
        "/api/v1/financial/business-services",
        json={
            "name": "Core Banking Payment Gateway",
            "description": "Primary transactional settlement service",
            "revenue_dependency": 0.95,
            "criticality": "CRITICAL",
            "daily_transaction_count": 50000,
            "average_transaction_value": 1500.0,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    service = create_res.json()
    assert service["name"] == "Core Banking Payment Gateway"
    assert service["revenue_dependency"] == 0.95

    # List
    list_res = await client.get("/api/v1/financial/business-services", headers=headers)
    assert list_res.status_code == 200
    services = list_res.json()
    assert len(services) >= 1
    assert any(s["name"] == "Core Banking Payment Gateway" for s in services)


@pytest.mark.asyncio
async def test_financial_calculate_and_assessment_endpoints(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Calculate financial loss for an asset vulnerability and verify all endpoints."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup asset, vuln, av, risk_assessment
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="PCI-Payment-Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        financial_dependency_factor=0.9,
        internet_exposed=True,
        business_value=5000000.0,
    )
    db_session.add(asset)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-1111",
        description="Remote code execution in payment processor",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)

    risk = RiskAssessment(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        asset_id=asset.id,
        asset_vulnerability_id=av.id,
        final_risk_score=92.0,
        risk_level="CRITICAL",
    )
    db_session.add(risk)
    await db_session.commit()

    # 1. Trigger Calculation (Synchronous)
    calc_res = await client.post(
        "/api/v1/financial/calculate",
        json={
            "asset_vulnerability_id": str(av.id),
            "simulation_count": 2000,
            "random_seed": 42,
            "synchronous": True,
        },
        headers=headers,
    )
    assert calc_res.status_code == 202
    calc_data = calc_res.json()
    fa_id = calc_data["financial_assessment_id"]
    job_id = calc_data["job_id"]
    assert calc_data["status"] == "COMPLETED"

    # 2. Check Job status endpoint
    job_res = await client.get(f"/api/v1/simulation/{job_id}", headers=headers)
    assert job_res.status_code == 200
    assert job_res.json()["status"] == "COMPLETED"
    assert job_res.json()["progress"] == 100

    # 3. Get Financial Assessment Details
    fa_res = await client.get(f"/api/v1/financial/{fa_id}", headers=headers)
    assert fa_res.status_code == 200
    fa_data = fa_res.json()
    assert fa_data["id"] == str(fa_id)
    assert fa_data["expected_loss"] > 0
    assert fa_data["annual_expected_loss"] > 0
    assert fa_data["p10"] <= fa_data["p50"] <= fa_data["p90"] <= fa_data["p95"]
    assert len(fa_data["factors"]) >= 5

    # 4. Get Breakdown
    bd_res = await client.get(f"/api/v1/financial/{fa_id}/breakdown", headers=headers)
    assert bd_res.status_code == 200
    bd_data = bd_res.json()
    assert "revenue_loss" in bd_data
    assert "incident_response" in bd_data
    assert "percentage_contributions" in bd_data

    # 5. Get Distribution Histogram
    dist_res = await client.get(f"/api/v1/financial/{fa_id}/distribution", headers=headers)
    assert dist_res.status_code == 200
    dist_data = dist_res.json()
    assert len(dist_data["bins"]) >= 10
    assert sum(dist_data["frequencies"]) == 2000

    # 6. Scenario Analysis (BEST_CASE vs WORST_CASE)
    best_res = await client.post(
        "/api/v1/financial/scenario",
        json={
            "asset_vulnerability_id": str(av.id),
            "scenario_type": "BEST_CASE",
            "simulation_count": 1000,
        },
        headers=headers,
    )
    assert best_res.status_code == 200
    best_data = best_res.json()

    worst_res = await client.post(
        "/api/v1/financial/scenario",
        json={
            "asset_vulnerability_id": str(av.id),
            "scenario_type": "WORST_CASE",
            "simulation_count": 1000,
        },
        headers=headers,
    )
    assert worst_res.status_code == 200
    worst_data = worst_res.json()

    # Worst case expected loss should be strictly greater than best case
    assert worst_data["expected_loss"] > best_data["expected_loss"]

    # 7. What-If Analysis (reducing downtime)
    what_if_res = await client.post(
        "/api/v1/financial/what-if",
        json={
            "asset_vulnerability_id": str(av.id),
            "downtime_hours": 1.0,
        },
        headers=headers,
    )
    assert what_if_res.status_code == 200
    wi_data = what_if_res.json()
    assert wi_data["baseline_expected_loss"] > 0
    assert "loss_reduction" in wi_data

    # 8. Control Scenario ROI
    roi_res = await client.post(
        "/api/v1/financial/control-scenario",
        json={
            "asset_vulnerability_id": str(av.id),
            "control": "Web Application Firewall (WAF)",
            "implementation_cost": 250000.0,
            "risk_reduction": 0.35,
        },
        headers=headers,
    )
    assert roi_res.status_code == 200
    roi_data = roi_res.json()
    assert roi_data["control"] == "Web Application Firewall (WAF)"
    assert roi_data["risk_reduction_value"] > 0
    assert "roi" in roi_data

    # 9. Organization Summaries
    sum_res = await client.get("/api/v1/financial/organization/summary", headers=headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["total_expected_annual_loss"] > 0
    assert sum_data["assessed_vulnerabilities_count"] >= 1

    top_res = await client.get("/api/v1/financial/organization/top-losses?limit=5", headers=headers)
    assert top_res.status_code == 200
    top_items = top_res.json()
    assert len(top_items) >= 1
    assert top_items[0]["asset_name"] == "PCI-Payment-Server"


@pytest.mark.asyncio
async def test_tenant_isolation_financial_access(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    other_org: Organization,
    admin_user: User,
):
    """User from Org A cannot access or calculate financial data for Org B's assets."""
    asset_b = Asset(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        name="OrgB-Confidential-Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
    )
    db_session.add(asset_b)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-9999",
        description="Sample flaw",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.0,
    )
    db_session.add(vuln)

    av_b = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset_b.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av_b)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to calculate financial impact on Org B's asset vulnerability
    res = await client.post(
        "/api/v1/financial/calculate",
        json={"asset_vulnerability_id": str(av_b.id), "synchronous": True},
        headers=headers,
    )
    assert res.status_code == 403
