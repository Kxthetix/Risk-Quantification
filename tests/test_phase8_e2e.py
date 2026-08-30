"""Comprehensive End-to-End Integration Test for Phase 8.

Lifecycle Journey:
1. Organization & User Registration
2. Asset & Software Provisioning (Phase 2)
3. CVE Intelligence & Mapping (Phase 3)
4. Empirical Validation & Confidence (Phase 4)
5. Cyber Risk Scoring (Phase 5)
6. Financial Loss Assessment & Distributions (Phase 6)
7. Attack Path Graph Discovery & Chokepoint Identification (Phase 7)
8. Contextual Remediation Prioritization (Phase 8)
9. Control Seeding & Effectiveness Mapping (Phase 8)
10. Cybersecurity Budget Knapsack Optimization (Phase 8)
11. Verification & Finding Closure (Phase 8)
"""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.attack_path import AttackPath
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AssetVulnerabilityStatus,
    ExploitAvailability,
    RemediationStatus,
    RemediationType,
    RiskLevel,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.financial_assessment import FinancialAssessment
from app.models.financial_profile import FinancialProfile
from app.models.organization import Organization
from app.models.risk_assessment import RiskAssessment
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_phase8_full_e2e_remediation_and_optimization_lifecycle(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify entire pipeline from Asset Risk -> Path -> Financial Loss -> Remediation -> Knapsack Optimization -> Verification."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create Core Assets
    web_server = Asset(
        organization_id=test_org.id,
        name="Payments DMZ Gateway",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        business_value=15000000.0,
        internet_exposed=True,
    )
    db_cluster = Asset(
        organization_id=test_org.id,
        name="Core Payments DB Cluster",
        asset_type=AssetType.DATABASE,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        business_value=50000000.0,
        internet_exposed=False,
    )
    db_session.add_all([web_server, db_cluster])
    await db_session.flush()

    # Step 2: Add High-Severity Vulnerability
    vuln = Vulnerability(
        cve_id="CVE-2026-8888",
        description="Spring Framework Unauthenticated Remote Code Execution",
        cvss_score=9.8,
        severity=VulnerabilitySeverity.CRITICAL,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
    )
    db_session.add(vuln)
    await db_session.flush()

    # Step 3: Asset-Vulnerability Junction & Risk / Financial Assessments
    av = AssetVulnerability(
        asset_id=web_server.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)
    await db_session.flush()

    risk = RiskAssessment(
        organization_id=test_org.id,
        asset_id=web_server.id,
        asset_vulnerability_id=av.id,
        final_risk_score=92.5,
        risk_level=RiskLevel.CRITICAL,
        likelihood_score=85.0,
        impact_score=95.0,
    )
    fin = FinancialAssessment(
        organization_id=test_org.id,
        asset_id=web_server.id,
        asset_vulnerability_id=av.id,
        expected_loss=4500000.0,
        p50_loss=3800000.0,
        p90_loss=9200000.0,
        p95_loss=12000000.0,
    )
    # Attack Path through web_server
    path = AttackPath(
        organization_id=test_org.id,
        source_node="Internet",
        target_node=db_cluster.name,
        target_asset_id=db_cluster.id,
        path_score=88.0,
        path_length=2,
        financial_exposure=9200000.0,
    )
    db_session.add_all([risk, fin, path])
    await db_session.commit()

    # Step 4: Seed Defensive Controls
    seed_res = await client.post("/api/v1/controls/seed-defaults", headers=headers)
    assert seed_res.status_code == 200

    # Step 5: Create Contextual Remediation for finding
    rem_payload = {
        "asset_vulnerability_id": str(av.id),
        "title": "Upgrade Spring Boot & Apply WAF Virtual Patch",
        "description": "Remediates CVE-2026-8888 RCE and breaks external attack path",
        "remediation_type": "PATCH",
        "estimated_cost": 150000.0,
        "estimated_duration_hours": 6.0,
        "cost_details": {
            "minimum_cost": 100000.0,
            "most_likely_cost": 150000.0,
            "maximum_cost": 250000.0,
            "labor_cost": 100000.0,
            "technology_cost": 50000.0,
            "one_time_cost": 150000.0,
            "confidence": 0.95,
        },
    }
    rem_res = await client.post("/api/v1/remediations", json=rem_payload, headers=headers)
    assert rem_res.status_code == 201
    rem_data = rem_res.json()
    rem_id = rem_data["id"]

    # Priority should be CRITICAL / HIGH due to 92.5 Risk + KEV + Attack Path + ₹45L loss
    assert rem_data["priority_score"] >= 75.0
    assert rem_data["priority_level"] in ("CRITICAL", "HIGH")
    assert rem_data["expected_loss_reduction"] >= 3500000.0

    # Step 6: Top Remediations Query
    top_res = await client.get("/api/v1/remediations/top", headers=headers)
    assert top_res.status_code == 200
    top_data = top_res.json()
    assert len(top_data["items"]) >= 1
    assert top_data["items"][0]["cve_id"] == "CVE-2026-8888"

    # Step 7: Simulate Remediation
    sim_res = await client.post(f"/api/v1/remediations/{rem_id}/simulate", headers=headers)
    assert sim_res.status_code == 200
    sim = sim_res.json()
    assert sim["roi"] > 1000.0
    assert sim["residual_risk"] < 25.0
    assert sim["residual_risk"] < sim["current_risk"]

    # Step 8: Execute Portfolio Optimization (0/1 Knapsack)
    opt_res = await client.post(
        "/api/v1/optimization/run",
        json={"budget": 1000000.0, "algorithm": "KNAPSACK", "horizon_years": 1},
        headers=headers,
    )
    assert opt_res.status_code == 200
    opt = opt_res.json()
    assert opt["total_cost"] <= 1000000.0
    assert opt["expected_loss_reduction"] > 0
    assert len(opt["selected_actions"]) >= 1

    # Step 9: Strategic Alternatives & Executive Summary
    alts_res = await client.get("/api/v1/optimization/alternatives?budget=1000000.0", headers=headers)
    assert alts_res.status_code == 200
    assert len(alts_res.json()["alternatives"]) == 4

    exec_res = await client.get("/api/v1/optimization/executive-summary", headers=headers)
    assert exec_res.status_code == 200
    assert exec_res.json()["action_priority"] is not None

    # Step 10: Complete & Empirically Verify Remediation
    comp_res = await client.post(f"/api/v1/remediations/{rem_id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    ver_res = await client.post(
        f"/api/v1/remediations/{rem_id}/verify",
        json={"evidence": {"scan_id": "QUALYS-20260829-01", "result": "PATCH_CONFIRMED"}},
        headers=headers,
    )
    assert ver_res.status_code == 200
    assert ver_res.json()["status"] == "VERIFIED"

    # Finding should now be RESOLVED
    await db_session.refresh(av)
    assert av.status == AssetVulnerabilityStatus.RESOLVED
