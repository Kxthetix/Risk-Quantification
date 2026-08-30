"""Phase 6 End-to-End Test: Asset -> Software -> CVE -> CPE -> Validation -> Risk Score -> Financial Profile -> Financial Factors -> Monte Carlo -> Expected Loss -> P10/P50/P90 -> Breakdown -> Control ROI."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.asset_software import AssetSoftware
from app.models.asset_vulnerability import AssetVulnerability
from app.models.cpe import CPE
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
from app.models.software import Software
from app.models.user import User
from app.models.vulnerability import Vulnerability, VulnerabilityCPE


@pytest.mark.asyncio
async def test_phase6_end_to_end_financial_quantification(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Full lifecycle demonstration of Phase 6 Financial Quantification & Monte Carlo.

    Flow:
    1. Organization Financial Profile: 50,00,00,000 annual revenue (~2,50,000/hr), 200 employees.
    2. Business Service: 'Primary Transaction Processing' (90% dependency).
    3. Asset: 'Production Payment Server', CRITICAL, RESTRICTED data, Internet exposed, business_value=50,00,000.
    4. Software & CPE & CVE: Apache HTTP Server 2.4.49, CVE-2021-41773, CVSS 9.8, KEV YES.
    5. Phase 4 Validation Engine: Confirmed vulnerability with active services and configuration.
    6. Phase 5 Cyber Risk Engine: Calculates score ~90.0 (CRITICAL).
    7. Phase 6 Financial Engine: Monte Carlo simulation with 3,000 runs.
    8. Verifies:
       - Single-Event Expected Loss > 0
       - Annual Expected Loss (ALE) > 0
       - Monotonic percentile ordering: P10 <= P50 <= P90 <= P95
       - Loss breakdown (downtime, response, recovery, data breach, etc.)
       - Security Control ROI evaluation (e.g. WAF investment).
    """
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Configure Financial Profile
    await client.put(
        "/api/v1/financial/profile",
        json={
            "annual_revenue": 500000000.0,
            "operating_days_per_year": 250,
            "hours_per_day": 8,
            "employee_count": 200,
            "average_hourly_employee_cost": 400.0,
            "incident_response_hourly_cost": 3000.0,
            "backup_recovery_hourly_cost": 2000.0,
            "customer_count": 10000,
            "cost_per_record": 350.0,
        },
        headers=headers,
    )

    # Step 2: Create Business Service
    bs_res = await client.post(
        "/api/v1/financial/business-services",
        json={
            "name": "Primary Transaction Processing",
            "revenue_dependency": 0.90,
            "criticality": "CRITICAL",
            "daily_transaction_count": 100000,
            "average_transaction_value": 2500.0,
        },
        headers=headers,
    )
    assert bs_res.status_code == 201
    business_service_id = bs_res.json()["id"]

    # Step 3: Asset
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        business_service_id=uuid.UUID(business_service_id),
        name="Production Payment Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        financial_dependency_factor=0.90,
        internet_exposed=True,
        business_value=5000000.0,
    )
    db_session.add(asset)

    # Step 4: Software, CPE, and CVE
    software = Software(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        product_name="Apache HTTP Server",
        product_version="2.4.49",
        vendor="Apache",
    )
    db_session.add(software)

    cpe = CPE(
        id=uuid.uuid4(),
        cpe_string="cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
        part="a",
        vendor="apache",
        product="http_server",
        version="2.4.49",
    )
    db_session.add(cpe)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="Apache HTTP Server path traversal and RCE",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        cvss_version="3.1",
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln)

    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=cpe.id,
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )
    db_session.add(vcpe)

    asset_sw = AssetSoftware(
        id=uuid.uuid4(),
        asset_id=asset.id,
        software_id=software.id,
        installed_version="2.4.49",
        is_active=True,
    )
    db_session.add(asset_sw)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)
    await db_session.commit()

    # Step 5: Empirical Evidence & Validation Engine Run
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={"evidence_type": "SERVICE", "source": "NETWORK_SCAN", "value": "httpd active", "result": "CONFIRMED", "confidence": 1.0},
        headers=headers,
    )
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={"evidence_type": "PORT", "source": "NETWORK_SCAN", "value": "443/tcp open", "result": "CONFIRMED", "confidence": 1.0},
        headers=headers,
    )
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={"evidence_type": "CONFIGURATION", "source": "CONFIGURATION_SCAN", "value": "mod_cgi enabled", "result": "CONFIRMED", "confidence": 0.95},
        headers=headers,
    )

    # Run Validation
    val_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert val_res.status_code == 202

    # Step 6: Cyber Risk Scoring Engine Run
    risk_res = await client.post(
        "/api/v1/risk/calculate",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert risk_res.status_code == 202

    # Step 7: Phase 6 Financial Quantification Run
    calc_res = await client.post(
        "/api/v1/financial/calculate",
        json={
            "asset_vulnerability_id": str(av.id),
            "simulation_count": 3000,
            "random_seed": 101,
            "synchronous": True,
        },
        headers=headers,
    )
    assert calc_res.status_code == 202
    fa_id = calc_res.json()["financial_assessment_id"]

    # Step 8: Verify Complete Financial Results
    assessment_res = await client.get(f"/api/v1/financial/{fa_id}", headers=headers)
    assert assessment_res.status_code == 200
    fa_data = assessment_res.json()

    assert fa_data["currency"] == "INR"
    assert fa_data["expected_loss"] > 0.0
    assert fa_data["annual_expected_loss"] > 0.0
    assert fa_data["p10"] <= fa_data["p50"] <= fa_data["p90"] <= fa_data["p95"]

    # Step 9: Verify Breakdown
    bd_res = await client.get(f"/api/v1/financial/{fa_id}/breakdown", headers=headers)
    assert bd_res.status_code == 200
    bd_data = bd_res.json()
    assert bd_data["revenue_loss"] > 0.0
    assert bd_data["data_breach"] > 0.0
    assert bd_data["recovery"] > 0.0
    assert len(bd_data["percentage_contributions"]) >= 5

    # Step 10: Security Control ROI
    roi_res = await client.post(
        "/api/v1/financial/control-scenario",
        json={
            "asset_vulnerability_id": str(av.id),
            "control": "Automated Micro-Segmentation & Virtual Patching",
            "implementation_cost": 300000.0,
            "risk_reduction": 0.40,
        },
        headers=headers,
    )
    assert roi_res.status_code == 200
    roi_data = roi_res.json()
    assert roi_data["control"] == "Automated Micro-Segmentation & Virtual Patching"
    assert roi_data["risk_reduction_value"] > 0
    assert roi_data["roi"] > 0
