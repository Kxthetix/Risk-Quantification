"""Comprehensive End-to-End Integration Test for Phase 9: Executive Dashboard, Reporting & Decision Support."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.attack_path import AttackPath
from app.models.business_service import BusinessService
from app.models.control import Control
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AssetVulnerabilityStatus,
    ControlType,
    ExploitAvailability,
    RemediationStatus,
    RemediationType,
    RiskLevel,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.financial_assessment import FinancialAssessment
from app.models.organization import Organization
from app.models.remediation import Remediation
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_phase9_full_executive_dashboard_and_reporting_lifecycle(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify entire pipeline: Asset -> Vuln -> Risk -> Loss -> Path -> Remediation -> Snapshot -> Dashboard -> Report."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create Business Service & Assets
    service = BusinessService(
        organization_id=test_org.id,
        name="Digital Banking Core",
        criticality=AssetCriticality.CRITICAL,
        revenue_dependency=1.0,
    )
    db_session.add(service)
    await db_session.flush()

    gateway = Asset(
        organization_id=test_org.id,
        business_service_id=service.id,
        name="API Banking Gateway",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        business_value=25000000.0,
        internet_exposed=True,
    )
    db_session.add(gateway)
    await db_session.flush()

    # Step 2: Vulnerability Intelligence & Matching
    vuln = Vulnerability(
        cve_id="CVE-2026-9999",
        description="Zero-day Unauthenticated Remote Code Execution in API Gateway",
        cvss_score=9.9,
        severity=VulnerabilitySeverity.CRITICAL,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
    )
    db_session.add(vuln)
    await db_session.flush()

    av = AssetVulnerability(
        asset_id=gateway.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)
    await db_session.flush()

    # Step 3: Risk & Financial Quantification
    risk = RiskAssessment(
        organization_id=test_org.id,
        asset_id=gateway.id,
        asset_vulnerability_id=av.id,
        final_risk_score=96.0,
        risk_level=RiskLevel.CRITICAL,
        likelihood_score=92.0,
        impact_score=98.0,
    )
    fin = FinancialAssessment(
        organization_id=test_org.id,
        asset_id=gateway.id,
        asset_vulnerability_id=av.id,
        expected_loss=8500000.0,
        p10_loss=3200000.0,
        p50_loss=7400000.0,
        p90_loss=19500000.0,
        p95_loss=26000000.0,
    )
    path = AttackPath(
        organization_id=test_org.id,
        source_node="Internet",
        target_node=gateway.name,
        target_asset_id=gateway.id,
        path_score=94.0,
        path_length=1,
        financial_exposure=19500000.0,
    )
    db_session.add_all([risk, fin, path])
    await db_session.flush()

    # Step 4: Defensive Control & Remediation
    ctrl = Control(
        organization_id=test_org.id,
        name="NextGen Cloud WAF",
        control_type=ControlType.WAF,
        effectiveness=0.95,
        implementation_cost=150000.0,
        annual_cost=30000.0,
        enabled=True,
    )
    rem = Remediation(
        organization_id=test_org.id,
        asset_vulnerability_id=av.id,
        title="Apply Zero-Day Security Patch & WAF Rule",
        description="Neutralizes CVE-2026-9999",
        remediation_type=RemediationType.PATCH,
        status=RemediationStatus.IN_PROGRESS,
        estimated_cost=120000.0,
        priority_score=95.0,
        expected_loss_reduction=8000000.0,
    )
    db_session.add_all([ctrl, rem])
    await db_session.commit()

    # Step 5: Capture Snapshot
    snap_res = await client.post("/api/v1/trends/snapshots", headers=headers)
    assert snap_res.status_code == 201

    # Step 6: Query Executive Dashboard
    dash_res = await client.get("/api/v1/dashboard/executive", headers=headers)
    assert dash_res.status_code == 200
    dash = dash_res.json()
    assert dash["overall_risk_score"] >= 90.0
    assert dash["risk_level"] == "CRITICAL"
    assert dash["expected_annual_loss"] >= 8000000.0
    assert dash["p90_loss"] >= 19000000.0
    assert dash["critical_assets"] >= 1
    assert dash["critical_vulnerabilities"] >= 1
    assert dash["critical_attack_paths"] >= 1

    # Step 7: Query KPIs
    kpi_res = await client.get("/api/v1/dashboard/kpis", headers=headers)
    assert kpi_res.status_code == 200
    kpis = kpi_res.json()
    assert kpis["critical_findings"] >= 1
    assert kpis["critical_attack_paths"] >= 1

    # Step 8: Query Heatmap & Surface
    hm_res = await client.get("/api/v1/dashboard/risk-heatmap", headers=headers)
    assert hm_res.status_code == 200
    hm = hm_res.json()
    assert len(hm["cells"]) == 25

    surf_res = await client.get("/api/v1/dashboard/attack-surface", headers=headers)
    assert surf_res.status_code == 200
    surf = surf_res.json()
    assert surf["internet_facing"] >= 1
    assert surf["known_exploited_assets"] >= 1

    # Step 9: Query Compliance Frameworks
    comp_res = await client.get("/api/v1/compliance/ISO%2FIEC%2027001", headers=headers)
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert comp["implemented_count"] >= 1

    # Step 10: Compile Full Executive Report (JSON & PDF)
    rep_payload = {
        "report_type": "EXECUTIVE_RISK",
        "period": "30d",
        "format": "JSON",
    }
    rep_res = await client.post("/api/v1/reports", json=rep_payload, headers=headers)
    assert rep_res.status_code == 202
    job_id = rep_res.json()["id"]

    # Verify Report Download
    dl_res = await client.get(f"/api/v1/reports/{job_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert len(dl_res.content) > 0
