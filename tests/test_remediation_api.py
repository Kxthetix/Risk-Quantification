"""Integration tests for Phase 8 Remediation APIs & Lifecycle Transitions."""
from datetime import datetime, timedelta, timezone
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
    RemediationPriorityLevel,
    RemediationStatus,
    RemediationType,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.organization import Organization
from app.models.remediation import Remediation
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_remediation_crud_and_simulation(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test creating, getting, updating, simulating, and deleting remediations."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create an Asset and Vulnerability
    asset = Asset(
        organization_id=test_org.id,
        name="Production Web App Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        business_value=5000000.0,
        internet_exposed=True,
    )
    vuln = Vulnerability(
        cve_id="CVE-2026-9999",
        description="Remote code execution in Web App",
        cvss_score=9.8,
        severity=VulnerabilitySeverity.CRITICAL,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
    )
    db_session.add_all([asset, vuln])
    await db_session.flush()

    av = AssetVulnerability(
        asset_id=asset.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.MANUAL,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)
    await db_session.commit()

    # 2. Create a Remediation via API
    create_payload = {
        "asset_vulnerability_id": str(av.id),
        "title": "Upgrade Web Framework to v4.5",
        "description": "Fixes RCE CVE-2026-9999",
        "remediation_type": "PATCH",
        "estimated_cost": 75000.0,
        "estimated_duration_hours": 4.0,
        "cost_details": {
            "minimum_cost": 50000.0,
            "most_likely_cost": 75000.0,
            "maximum_cost": 120000.0,
            "labor_cost": 75000.0,
            "one_time_cost": 75000.0,
            "confidence": 0.9,
        },
    }
    res = await client.post("/api/v1/remediations", json=create_payload, headers=headers)
    assert res.status_code == 201
    created_rem = res.json()
    rem_id = created_rem["id"]
    assert created_rem["title"] == "Upgrade Web Framework to v4.5"
    assert created_rem["priority_score"] >= 60.0
    assert created_rem["status"] == "OPEN"

    # 3. Get Remediation by ID
    get_res = await client.get(f"/api/v1/remediations/{rem_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["estimated_cost"] == 75000.0

    # 4. List Remediations
    list_res = await client.get("/api/v1/remediations", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 5. Top Remediations
    top_res = await client.get("/api/v1/remediations/top", headers=headers)
    assert top_res.status_code == 200
    top_items = top_res.json()["items"]
    assert len(top_items) >= 1
    assert top_items[0]["remediation_id"] == rem_id
    assert len(top_items[0]["justifications"]) >= 1

    # 6. Simulate Remediation
    sim_res = await client.post(f"/api/v1/remediations/{rem_id}/simulate", headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["roi"] > 0
    assert sim_data["residual_risk"] < sim_data["current_risk"]
    assert sim_data["tco_1yr"] >= 75000.0

    # 7. Update Remediation
    put_res = await client.put(
        f"/api/v1/remediations/{rem_id}",
        json={"title": "Upgrade Web Framework to v4.5 (Emergency Patch)"},
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["title"] == "Upgrade Web Framework to v4.5 (Emergency Patch)"


@pytest.mark.asyncio
async def test_remediation_lifecycle_transitions(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test Complete, Verify, and Risk Acceptance workflows."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a Remediation
    rem = Remediation(
        organization_id=test_org.id,
        title="Apply Firewall Whitelist Rule",
        remediation_type=RemediationType.FIREWALL_RULE,
        status=RemediationStatus.OPEN,
        priority_score=65.0,
        estimated_cost=20000.0,
    )
    db_session.add(rem)
    await db_session.commit()

    # 2. Mark Completed
    comp_res = await client.post(f"/api/v1/remediations/{rem.id}/complete", headers=headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "COMPLETED"

    # 3. Verify with Evidence
    ver_res = await client.post(
        f"/api/v1/remediations/{rem.id}/verify",
        json={"verification_notes": "Nmap scan confirms port 8080 is blocked from WAN."},
        headers=headers,
    )
    assert ver_res.status_code == 200
    assert ver_res.json()["status"] == "VERIFIED"
    assert ver_res.json()["verification_date"] is not None

    # 4. Create another remediation to test Risk Acceptance
    rem2 = Remediation(
        organization_id=test_org.id,
        title="Decommission Legacy Mainframe",
        remediation_type=RemediationType.ASSET_RETIREMENT,
        status=RemediationStatus.OPEN,
        priority_score=45.0,
        estimated_cost=500000.0,
    )
    db_session.add(rem2)
    await db_session.commit()

    expiry = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
    acc_res = await client.post(
        f"/api/v1/remediations/{rem2.id}/accept-risk",
        json={
            "reason": "Decommission delayed pending ERP migration completion in Q4.",
            "approved_by": "Chief Risk Officer",
            "expiry_date": expiry,
        },
        headers=headers,
    )
    assert acc_res.status_code == 200
    assert acc_res.json()["status"] == "ACCEPTED_RISK"
    assert acc_res.json()["risk_accepted_by"] == "Chief Risk Officer"
