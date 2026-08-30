"""Phase 4 End-to-End Test: Organization -> Asset -> Software -> CPE -> CVE -> Evidence -> Validation."""
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
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    ExploitAvailability,
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
async def test_phase4_end_to_end_vulnerability_validation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Full lifecycle demonstration of Phase 4 Validation & Evidence Engine.

    Flow:
    1. Organization (Alpha Security Corp)
    2. Asset (Production Web Server, internet_exposed=True, criticality=CRITICAL)
    3. Software (Apache HTTP Server 2.4.49)
    4. CPE (cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*)
    5. CVE (CVE-2021-41773, CVSS 9.8, affected versions >= 2.4.0 < 2.4.51, known exploited)
    6. Asset Vulnerability relationship
    7. Multi-source empirical evidence (Active Apache service, open port 443, mod_cgi config)
    8. Execute Validation Engine via API
    9. Validate result: CONFIRMED / LIKELY_VULNERABLE with high confidence and structured explainable reasons.
    """
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1 & 2: Asset
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Production Web Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        internet_exposed=True,
    )
    db_session.add(asset)

    # Step 3: Software
    software = Software(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        product_name="Apache HTTP Server",
        product_version="2.4.49",
        vendor="Apache",
    )
    db_session.add(software)

    # Step 4: CPE
    cpe = CPE(
        id=uuid.uuid4(),
        cpe_string="cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*",
        part="a",
        vendor="apache",
        product="http_server",
        version="2.4.49",
    )
    db_session.add(cpe)

    # Step 5: CVE
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        description="A flaw in path normalization in Apache HTTP Server 2.4.49 allows path traversal and RCE.",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        cvss_version="3.1",
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
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

    # Attach software to asset
    asset_sw = AssetSoftware(
        id=uuid.uuid4(),
        asset_id=asset.id,
        software_id=software.id,
        installed_version="2.4.49",
        is_active=True,
    )
    db_session.add(asset_sw)

    # Step 6: Asset Vulnerability match
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

    # Step 7: Multi-source empirical evidence via Evidence API
    # 7a. Port evidence (port 443 open)
    res_ev1 = await client.post(
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
    assert res_ev1.status_code == 201

    # 7b. Service evidence (Apache HTTP Server is active and listening)
    res_ev2 = await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "SERVICE",
            "source": "NETWORK_SCAN",
            "value": "Apache httpd 2.4.49 daemon running",
            "result": "CONFIRMED",
            "confidence": 1.0,
        },
        headers=headers,
    )
    assert res_ev2.status_code == 201

    # 7c. Configuration evidence (mod_cgi enabled)
    res_ev3 = await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{vuln.cve_id}/evidence",
        json={
            "evidence_type": "CONFIGURATION",
            "source": "CONFIGURATION_SCAN",
            "value": "mod_cgi enabled",
            "result": "CONFIRMED",
            "confidence": 0.90,
        },
        headers=headers,
    )
    assert res_ev3.status_code == 201

    # Step 8: Trigger Validation via Validation Engine API
    val_run_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert val_run_res.status_code == 202
    val_id = val_run_res.json()["validation_id"]

    # Step 9: Verify Validation Result & Explainability Output
    val_det_res = await client.get(f"/api/v1/validation/{val_id}/detailed", headers=headers)
    assert val_det_res.status_code == 200
    report = val_det_res.json()

    # Asset checks
    assert report["asset"]["name"] == "Production Web Server"
    assert report["asset"]["criticality"] == "CRITICAL"
    assert report["asset"]["internet_exposed"] is True

    # Software checks
    assert report["software"]["name"] == "Apache HTTP Server"
    assert report["software"]["version"] == "2.4.49"

    # Vulnerability checks
    assert report["vulnerability"]["cve_id"] == "CVE-2021-41773"
    assert report["vulnerability"]["cvss_score"] == 9.8
    assert report["vulnerability"]["severity"] == "CRITICAL"

    # Validation checks
    assert report["validation"]["status"] in ("CONFIRMED", "LIKELY_VULNERABLE")
    assert report["validation"]["score"] >= 80
    assert report["validation"]["confidence"] >= 0.85

    # Evidence checks
    evidence_types = [e["type"] for e in report["evidence"]]
    assert "PORT" in evidence_types
    assert "SERVICE" in evidence_types
    assert "CONFIGURATION" in evidence_types

    # Explainability reasons
    reasons_text = " ".join(report["reasons"])
    assert "2.4.49" in reasons_text or "affected" in reasons_text
    assert "mod_cgi" in reasons_text
    assert "internet" in reasons_text.lower() or "exposure" in reasons_text.lower()
