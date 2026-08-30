"""Integration tests for Validation API endpoints, rules, statistics, and review queue."""
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
async def test_run_validation_synchronous_flow(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Trigger synchronous validation and fetch result and detailed explainability."""
    # 1. Setup Vulnerability + Asset + Software + AssetVulnerability
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id=f"CVE-2022-{uuid.uuid4().hex[:5]}",
        description="RCE vulnerability in test daemon",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
    )
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=uuid.uuid4(),
        version_start_including="1.0.0",
        version_end_excluding="1.5.0",
    )
    vuln.vulnerability_cpes = [vcpe]
    db_session.add(vuln)

    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Gateway-Proxy",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        internet_exposed=True,
    )
    db_session.add(asset)

    software = Software(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        product_name="TestDaemon",
        product_version="1.2.0",
        vendor="Acme",
    )
    db_session.add(software)

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

    # 2. Add corroborating service evidence
    ev = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        asset_vulnerability_id=av.id,
        evidence_type=EvidenceType.SERVICE,
        source=EvidenceSource.NETWORK_SCAN,
        value="TestDaemon running on port 8080",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    db_session.add(ev)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Trigger validation (synchronous)
    run_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert run_res.status_code == 202
    run_data = run_res.json()
    val_id = run_data["validation_id"]
    assert run_data["status"] in ("CONFIRMED", "LIKELY_VULNERABLE")

    # 4. Get validation by ID
    get_res = await client.get(f"/api/v1/validation/{val_id}", headers=headers)
    assert get_res.status_code == 200
    val_data = get_res.json()
    assert val_data["id"] == val_id
    assert val_data["validation_score"] >= 60.0
    assert val_data["version_check"] == "CONFIRMED"
    assert val_data["evidence_count"] >= 1
    assert len(val_data["reasons"]) >= 1

    # 5. Get detailed explainability document
    det_res = await client.get(f"/api/v1/validation/{val_id}/detailed", headers=headers)
    assert det_res.status_code == 200
    det_data = det_res.json()
    assert det_data["asset"]["name"] == "Gateway-Proxy"
    assert det_data["vulnerability"]["cve_id"] == vuln.cve_id
    assert det_data["validation"]["status"] == val_data["status"]
    assert len(det_data["evidence"]) >= 1


@pytest.mark.asyncio
async def test_rerun_validation_history_tracking(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Revalidating an asset with newly introduced mitigation updates status and records history."""
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id=f"CVE-2022-{uuid.uuid4().hex[:5]}",
        description="Sample vulnerability",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.5,
    )
    vcpe = VulnerabilityCPE(
        id=uuid.uuid4(),
        vulnerability_id=vuln.id,
        cpe_id=uuid.uuid4(),
        version_end_excluding="2.0.0",
    )
    vuln.vulnerability_cpes = [vcpe]
    db_session.add(vuln)

    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Target-Host",
        asset_type=AssetType.SERVER,
        internet_exposed=True,
    )
    db_session.add(asset)

    software = Software(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        product_name="TargetSoft",
        product_version="1.0.0",
        vendor="Acme",
    )
    db_session.add(software)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
    )
    db_session.add(av)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Initial validation run
    init_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    val_id = init_res.json()["validation_id"]

    # Now add mitigating security control
    ev = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        asset_vulnerability_id=av.id,
        evidence_type=EvidenceType.SECURITY_CONTROL,
        source=EvidenceSource.MANUAL,
        value="WAF virtual patch applied",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    db_session.add(ev)
    await db_session.commit()

    # Rerun validation
    rerun_res = await client.post(f"/api/v1/validation/{val_id}/rerun", headers=headers)
    assert rerun_res.status_code == 200
    rerun_data = rerun_res.json()
    assert rerun_data["mitigation_check"] == "MITIGATED"


@pytest.mark.asyncio
async def test_validation_statistics_and_review_queue(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Statistics endpoint aggregates status counts, and review queue flags low-confidence items."""
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id=f"CVE-2024-{uuid.uuid4().hex[:5]}",
        description="Ambiguous CVE",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.9,
    )
    db_session.add(vuln)

    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Review-Asset",
        asset_type=AssetType.SERVER,
    )
    db_session.add(asset)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=asset.id,
        vulnerability_id=vuln.id,
    )
    db_session.add(av)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Run validation (no version or config info -> UNKNOWN)
    run_res = await client.post(
        "/api/v1/validation/run",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert run_res.status_code == 202

    # Check statistics
    stats_res = await client.get("/api/v1/validation/statistics", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total"] >= 1
    assert stats["unknown"] >= 1 or stats["needs_manual_review"] >= 1

    # Check review queue
    rq_res = await client.get("/api/v1/validation/review-queue", headers=headers)
    assert rq_res.status_code == 200
    queue = rq_res.json()
    assert len(queue) >= 1
    assert queue[0]["asset_vulnerability_id"] == str(av.id)


@pytest.mark.asyncio
async def test_validation_rules_crud(
    client: AsyncClient,
    test_org: Organization,
    admin_user: User,
):
    """Retrieve and update validation rule weights."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # List rules
    list_res = await client.get("/api/v1/validation/rules", headers=headers)
    assert list_res.status_code == 200
    rules = list_res.json()
    assert len(rules) >= 6

    # Update weight of VERSION_MATCH
    put_res = await client.put(
        "/api/v1/validation/rules/VERSION_MATCH",
        json={"weight": 50.0, "enabled": True},
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["weight"] == 50.0
