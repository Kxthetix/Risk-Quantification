"""Integration tests for Cyber Risk Scoring Engine API endpoints (Phase 5)."""
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
    ValidationStatus,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability
from app.models.vulnerability_validation import VulnerabilityValidation


@pytest.mark.asyncio
async def test_risk_calculate_and_get_details(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Calculate cyber risk score synchronously and fetch assessment details."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create asset and vulnerability
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Fintech-API-Gateway",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        internet_exposed=True,
        business_value=1000000.0,
    )
    db_session.add(asset)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-44487",
        description="HTTP/2 Rapid Reset Denial of Service",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=7.5,
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

    val = VulnerabilityValidation(
        id=uuid.uuid4(),
        asset_vulnerability_id=av.id,
        validation_status=ValidationStatus.CONFIRMED,
        validation_score=85.0,
        confidence=0.90,
        version_check="CONFIRMED",
        configuration_check="CONFIRMED",
        exposure_check="INTERNET",
        exploit_check="KNOWN_EXPLOITED",
        mitigation_check="NONE",
        evidence_count=2,
    )
    db_session.add(val)
    await db_session.commit()

    # 2. Trigger risk calculation via API
    calc_res = await client.post(
        "/api/v1/risk/calculate",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )
    assert calc_res.status_code == 202
    calc_data = calc_res.json()
    risk_id = calc_data["risk_assessment_id"]
    assert calc_data["status"] == "COMPLETED"

    # 3. Fetch detailed risk assessment
    get_res = await client.get(f"/api/v1/risk/{risk_id}", headers=headers)
    assert get_res.status_code == 200
    risk_data = get_res.json()
    assert risk_data["id"] == risk_id
    assert risk_data["asset_id"] == str(asset.id)
    assert risk_data["score"] >= 65.0
    assert risk_data["level"] in ("HIGH", "VERY_HIGH", "CRITICAL")
    assert len(risk_data["factors"]) == 7
    assert len(risk_data["explanation"]) >= 1

    # 4. Recalculate risk
    recalc_res = await client.post(f"/api/v1/risk/{risk_id}/recalculate", headers=headers)
    assert recalc_res.status_code == 200
    recalc_data = recalc_res.json()
    assert recalc_data["id"] == risk_id


@pytest.mark.asyncio
async def test_asset_and_organization_risk_summaries(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Verify asset-level risk, organizational risk, distribution, and top risks."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup asset and vuln
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="DB-Cluster-Primary",
        asset_type=AssetType.DATABASE,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=False,
    )
    db_session.add(asset)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2022-30190",
        description="MSDT RCE Vulnerability",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=7.8,
        known_exploited=False,
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
    await db_session.commit()

    # Calculate risk
    await client.post(
        "/api/v1/risk/calculate",
        json={"asset_vulnerability_id": str(av.id), "synchronous": True},
        headers=headers,
    )

    # 1. Asset Risk Summary
    asset_res = await client.get(f"/api/v1/assets/{asset.id}/risk", headers=headers)
    assert asset_res.status_code == 200
    asset_data = asset_res.json()
    assert asset_data["asset_id"] == str(asset.id)
    assert asset_data["asset_name"] == "DB-Cluster-Primary"
    assert asset_data["open_findings"] >= 1

    # 2. Organization Risk Summary
    org_res = await client.get("/api/v1/risk/organization", headers=headers)
    assert org_res.status_code == 200
    org_data = org_res.json()
    assert org_data["assets"] >= 1
    assert org_data["overall_risk_score"] >= 0.0

    # 3. Risk Distribution
    dist_res = await client.get("/api/v1/risk/distribution", headers=headers)
    assert dist_res.status_code == 200
    dist_data = dist_res.json()
    total_findings = sum(dist_data.values())
    assert total_findings >= 1

    # 4. Top Risks
    top_res = await client.get("/api/v1/risk/top?limit=5", headers=headers)
    assert top_res.status_code == 200
    top_data = top_res.json()
    assert len(top_data["items"]) >= 1
    assert top_data["items"][0]["asset"] == "DB-Cluster-Primary"


@pytest.mark.asyncio
async def test_risk_configuration_and_rbac(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test getting and updating risk weights with admin RBAC check."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get config
    get_res = await client.get("/api/v1/risk/config", headers=headers)
    assert get_res.status_code == 200
    config_data = get_res.json()
    assert "CVSS" in config_data["weights"]

    # 2. Update config as admin
    put_res = await client.put(
        "/api/v1/risk/config",
        json={"weights": {"CVSS": 0.30, "ASSET_CRITICALITY": 0.25}},
        headers=headers,
    )
    assert put_res.status_code == 200
    updated_config = put_res.json()
    assert updated_config["weights"]["CVSS"] == 0.30


@pytest.mark.asyncio
async def test_tenant_isolation_risk_access(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    other_org: Organization,
    admin_user: User,
):
    """User from Org A cannot calculate or access risk for an asset belonging to Org B."""
    # Create asset in other_org
    asset_b = Asset(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        name="OrgB-Secret-Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
    )
    db_session.add(asset_b)

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-9999",
        description="Sample bug",
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

    # User from test_org tries to calculate risk for av_b
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post(
        "/api/v1/risk/calculate",
        json={"asset_vulnerability_id": str(av_b.id), "synchronous": True},
        headers=headers,
    )
    assert res.status_code == 403
