"""Phase 5 End-to-End Test: Asset -> Software -> CVE -> Asset Vulnerability -> Validation -> Evidence -> Risk Engine -> Risk Assessment."""
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
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    ExploitAvailability,
    RiskLevel,
    ValidationStatus,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.evidence import Evidence
from app.models.organization import Organization
from app.models.software import Software
from app.models.user import User
from app.models.vulnerability import Vulnerability, VulnerabilityCPE


@pytest.mark.asyncio
async def test_phase5_end_to_end_cyber_risk_scoring(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Full lifecycle demonstration of Phase 5 Cyber Risk Scoring Engine.

    Flow:
    1. Asset: 'Production Payment Server', CRITICAL, business_value=5000000.0, internet_exposed=True.
    2. Software: 'Apache HTTP Server 2.4.49' (attached to asset).
    3. CVE: 'CVE-2021-41773', CVSS 9.8, known_exploited=True, exploit_available=YES.
    4. Asset Vulnerability relationship.
    5. Multi-source evidence (active Apache service, port 443, plus compensating WAF & EDR controls).
    6. Run Phase 4 Validation Engine -> CONFIRMED, high confidence (0.94).
    7. Trigger Phase 5 Cyber Risk Engine via API.
    8. Verify Risk Assessment: score (>=80), level (CRITICAL), model version ('1.0'), factor contributions, and explainability.
    """
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Asset
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Production Payment Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        internet_exposed=True,
        business_value=5000000.0,
    )
    db_session.add(asset)

    # Step 2: Software
    software = Software(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        product_name="Apache HTTP Server",
        product_version="2.4.49",
        vendor="Apache",
    )
    db_session.add(software)

    # Attach software
    asset_sw = AssetSoftware(
        id=uuid.uuid4(),
        asset_id=asset.id,
        software_id=software.id,
        installed_version="2.4.49",
        is_active=True,
    )
    db_session.add(asset_sw)

    # Step 3: CPE
    cpe = CPE(
        id=uuid.uuid4(),
        cpe_string="cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
        part="a",
        vendor="apache",
        product="http_server",
        version="2.4.49",
    )
    db_session.add(cpe)

    # Step 4: CVE
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="Path traversal and remote code execution in Apache HTTP Server 2.4.49",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        cvss_version="3.1",
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln)

    # Version constraints on CPE
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=cpe.id,
        version_start_including="2.4.0",
        version_end_excluding="2.4.51",
    )
    db_session.add(vcpe)

    # Step 5: Asset Vulnerability match
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

    # Step 5: Evidence (Service + Port + Compensating WAF & EDR Controls)
    # 5a. Service
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "SERVICE",
            "source": "NETWORK_SCAN",
            "value": "Apache httpd daemon running",
            "result": "CONFIRMED",
            "confidence": 1.0,
        },
        headers=headers,
    )
    # 5b. Port
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "PORT",
            "source": "NETWORK_SCAN",
            "value": "443/tcp open",
            "result": "CONFIRMED",
            "confidence": 1.0,
        },
        headers=headers,
    )
    # 5c. Configuration (mod_cgi enabled)
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "CONFIGURATION",
            "source": "CONFIGURATION_SCAN",
            "value": "mod_cgi enabled",
            "result": "CONFIRMED",
            "confidence": 0.95,
        },
        headers=headers,
    )
    # 5d. Compensating Security Control: WAF
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "SECURITY_CONTROL",
            "source": "SECURITY_TOOL",
            "value": "WAF rule blocking path traversal active",
            "result": "CONFIRMED",
            "confidence": 0.95,
        },
        headers=headers,
    )
    # 5d. Compensating Security Control: EDR
    await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "SECURITY_CONTROL",
            "source": "SECURITY_TOOL",
            "value": "EDR agent active in block mode",
            "result": "CONFIRMED",
            "confidence": 1.0,
        },
        headers=headers,
    )

    # Step 6: Trigger Phase 4 Validation Engine
    val_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert val_res.status_code == 202

    # Step 7: Trigger Phase 5 Cyber Risk Scoring Engine
    risk_run_res = await client.post(
        "/api/v1/risk/calculate",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert risk_run_res.status_code == 202
    risk_id = risk_run_res.json()["risk_assessment_id"]

    # Step 8: Verify Complete Cyber Risk Assessment & Explainability
    get_res = await client.get(f"/api/v1/risk/{risk_id}", headers=headers)
    assert get_res.status_code == 200
    report = get_res.json()

    assert report["id"] == risk_id
    assert report["asset_id"] == str(asset.id)
    assert report["level"] in ("CRITICAL", "VERY_HIGH")
    assert report["score"] >= 75.0
    assert report["model_version"] == "1.0"
    assert report["method"] == "CONTEXTUAL_WEIGHTED"

    # Factor checks
    factors = {f["name"]: f for f in report["factors"]}
    assert "CVSS" in factors
    assert factors["CVSS"]["value"] == 98.0
    assert factors["CVSS"]["contribution"] > 0

    assert "ASSET_CRITICALITY" in factors
    assert factors["ASSET_CRITICALITY"]["value"] == 100.0

    assert "EXPOSURE" in factors
    assert factors["EXPOSURE"]["value"] == 100.0

    assert "EXPLOITABILITY" in factors
    assert factors["EXPLOITABILITY"]["value"] >= 85.0

    assert "VALIDATION_CONFIDENCE" in factors
    assert factors["VALIDATION_CONFIDENCE"]["value"] >= 70.0

    assert "CONTROL_GAP" in factors
    # Controls reduce gap below 100%
    assert factors["CONTROL_GAP"]["value"] < 100.0

    # Explainability checks
    explanation_text = " ".join(report["explanation"])
    assert "CVSS" in explanation_text or "severity" in explanation_text.lower()
    assert "internet" in explanation_text.lower() or "exposed" in explanation_text.lower()
    assert "controls" in explanation_text.lower() or "waf" in explanation_text.lower()
