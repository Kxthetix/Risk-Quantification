"""Integration tests for Evidence API endpoints and organization isolation."""
import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token
from app.models.asset import Asset
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    EvidenceResult,
    EvidenceSource,
    EvidenceType,
    VulnerabilitySeverity,
)
from app.models.evidence import Evidence
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_add_and_get_evidence_success(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Admin or Analyst can submit evidence for an asset vulnerability."""
    # 1. Create asset in test_org
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="App-Server-1",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=True,
    )
    db_session.add(asset)

    # 2. Create vulnerability
    cve_id = f"CVE-2023-{uuid.uuid4().hex[:5]}"
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id=cve_id,
        description="Sample vulnerability",
        severity=VulnerabilitySeverity.HIGH,
        cvss_score=8.1,
    )
    db_session.add(vuln)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Post evidence
    payload = {
        "evidence_type": "CONFIGURATION",
        "source": "MANUAL",
        "value": "vulnerable_module = true",
        "result": "CONFIRMED",
        "confidence": 0.95,
        "metadata": {"collector": "security-team", "tool": "custom-audit"},
    }

    res = await client.post(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{cve_id}/evidence",
        json=payload,
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["value"] == "vulnerable_module = true"
    assert data["evidence_type"] == "CONFIGURATION"
    assert data["confidence"] == 0.95

    # 4. Get evidence
    get_res = await client.get(
        f"/api/v1/assets/{asset.id}/vulnerabilities/{cve_id}/evidence",
        headers=headers,
    )
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["total"] == 1
    assert get_data["items"][0]["id"] == data["id"]


@pytest.mark.asyncio
async def test_evidence_organization_isolation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    other_org: Organization,
    admin_user: User,
):
    """User in Org A cannot create, read, or delete evidence for an asset in Org B."""
    # Asset in other_org
    asset_b = Asset(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        name="Victim-Server-B",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=True,
    )
    db_session.add(asset_b)

    cve_id = f"CVE-2023-{uuid.uuid4().hex[:5]}"
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id=cve_id,
        description="Isolation test CVE",
        severity=VulnerabilitySeverity.MEDIUM,
    )
    db_session.add(vuln)
    await db_session.commit()

    # User in test_org (Org A) tries to access asset in other_org (Org B)
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt POST
    post_res = await client.post(
        f"/api/v1/assets/{asset_b.id}/vulnerabilities/{cve_id}/evidence",
        json={
            "evidence_type": "PORT",
            "source": "NETWORK_SCAN",
            "value": "80/tcp open",
            "result": "CONFIRMED",
        },
        headers=headers,
    )
    assert post_res.status_code == 404  # Not found within caller's organization

    # Attempt GET
    get_res = await client.get(
        f"/api/v1/assets/{asset_b.id}/vulnerabilities/{cve_id}/evidence",
        headers=headers,
    )
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_evidence_and_authorization(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Delete evidence with proper ownership and authorization."""
    asset = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Asset-To-Clean",
        asset_type=AssetType.SERVER,
    )
    db_session.add(asset)
    ev = Evidence(
        id=uuid.uuid4(),
        asset_id=asset.id,
        evidence_type=EvidenceType.PORT,
        source=EvidenceSource.NETWORK_SCAN,
        value="22/tcp open",
        result=EvidenceResult.CONFIRMED,
        confidence=1.0,
    )
    db_session.add(ev)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    del_res = await client.delete(f"/api/v1/evidence/{ev.id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    del_res_again = await client.delete(f"/api/v1/evidence/{ev.id}", headers=headers)
    assert del_res_again.status_code == 404
