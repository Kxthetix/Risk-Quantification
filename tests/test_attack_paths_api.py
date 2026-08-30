"""Integration tests for Phase 7 Network Relationships, Attack Paths, and Threat Scenario APIs."""
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
    NetworkDirection,
    NetworkRelationshipType,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.organization import Organization
from app.models.user import User
from app.models.vulnerability import Vulnerability


@pytest.mark.asyncio
async def test_network_relationships_crud(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test creating, listing, updating, and deleting network topology links."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup 2 assets
    asset_1 = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="DMZ-Web-Proxy",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        internet_exposed=True,
    )
    asset_2 = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="App-Backend",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
    )
    db_session.add_all([asset_1, asset_2])
    await db_session.commit()

    # 1. Create Relationship
    create_res = await client.post(
        "/api/v1/network/relationships",
        json={
            "source_asset_id": str(asset_1.id),
            "destination_asset_id": str(asset_2.id),
            "relationship_type": "NETWORK_REACHABILITY",
            "protocol": "TCP",
            "port": 8080,
            "direction": "OUTBOUND",
            "verified": True,
            "confidence": 0.95,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    rel_data = create_res.json()
    rel_id = rel_data["id"]
    assert rel_data["port"] == 8080
    assert rel_data["confidence"] == 0.95

    # 2. List
    list_res = await client.get("/api/v1/network/relationships", headers=headers)
    assert list_res.status_code == 200
    rels = list_res.json()
    assert len(rels) >= 1
    assert any(r["id"] == rel_id for r in rels)

    # 3. Get single
    get_res = await client.get(f"/api/v1/network/relationships/{rel_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == rel_id

    # 4. Update
    put_res = await client.put(
        f"/api/v1/network/relationships/{rel_id}",
        json={"port": 8443, "protocol": "HTTPS", "confidence": 0.99},
        headers=headers,
    )
    assert put_res.status_code == 200
    assert put_res.json()["port"] == 8443
    assert put_res.json()["protocol"] == "HTTPS"

    # 5. Delete
    del_res = await client.delete(f"/api/v1/network/relationships/{rel_id}", headers=headers)
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_attack_path_analysis_and_graph_endpoints(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test full attack path discovery, top paths, asset paths, and graph visualization."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup 3-tier architecture: Web -> App -> DB
    web = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Public-Web",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=True,
    )
    app_srv = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Internal-App",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=False,
    )
    db_srv = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Payment-DB",
        asset_type=AssetType.DATABASE,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        internet_exposed=False,
    )
    db_session.add_all([web, app_srv, db_srv])

    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2022-22965",
        description="Spring4Shell RCE",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=web.id,
        vulnerability_id=vuln.id,
        match_method=VulnerabilityMatchMethod.CPE,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)
    await db_session.commit()

    # Network connections: Web -> App -> DB
    await client.post(
        "/api/v1/network/relationships",
        json={"source_asset_id": str(web.id), "destination_asset_id": str(app_srv.id), "port": 8080},
        headers=headers,
    )
    await client.post(
        "/api/v1/network/relationships",
        json={"source_asset_id": str(app_srv.id), "destination_asset_id": str(db_srv.id), "port": 5432},
        headers=headers,
    )

    # 1. Trigger Attack Path Analysis (Synchronous)
    analyze_res = await client.post(
        "/api/v1/attack-paths/analyze",
        json={"max_path_length": 8, "synchronous": True},
        headers=headers,
    )
    assert analyze_res.status_code == 200
    analysis_data = analyze_res.json()
    assert analysis_data["total_paths"] >= 1
    paths = analysis_data["paths"]
    path_id = paths[0]["path_id"]

    # 2. Get Single Path Detail
    path_res = await client.get(f"/api/v1/attack-paths/{path_id}", headers=headers)
    assert path_res.status_code == 200
    p_data = path_res.json()
    assert p_data["path_score"] > 0.0
    assert len(p_data["nodes"]) >= 3
    assert len(p_data["edges"]) >= 2

    # 3. Get Top Attack Paths
    top_res = await client.get("/api/v1/attack-paths/top?limit=5", headers=headers)
    assert top_res.status_code == 200
    assert len(top_res.json()) >= 1

    # 4. Get Chokepoints
    choke_res = await client.get("/api/v1/attack-paths/chokepoints", headers=headers)
    assert choke_res.status_code == 200
    chokepoints = choke_res.json()
    assert len(chokepoints) >= 1

    # 5. Get Asset Attack Paths
    asset_paths_res = await client.get(f"/api/v1/assets/{db_srv.id}/attack-paths", headers=headers)
    assert asset_paths_res.status_code == 200
    ap_data = asset_paths_res.json()
    assert len(ap_data["incoming_paths"]) >= 1

    # 6. Get Complete Attack Graph (Visualization Format)
    graph_res = await client.get("/api/v1/attack-graph", headers=headers)
    assert graph_res.status_code == 200
    g_data = graph_res.json()
    assert len(g_data["nodes"]) >= 3
    assert len(g_data["edges"]) >= 2


@pytest.mark.asyncio
async def test_threat_scenario_endpoints_and_comparison(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Test threat scenario creation, template generation, and scenario comparison."""
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Custom Scenario
    create_res = await client.post(
        "/api/v1/threat-scenarios",
        json={
            "name": "Supply Chain Dependency Infiltration",
            "description": "Compromised third-party vendor credentials used to pivot to internal network",
            "attacker_profile": "THIRD_PARTY",
            "objective": "Access Source Code Repositories",
            "probability": 0.55,
            "confidence": 0.85,
            "risk_score": 68.0,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    sc_id = create_res.json()["id"]

    # 2. Auto-generate baseline scenarios
    gen_res = await client.post(
        "/api/v1/threat-scenarios/generate",
        json={"generate_templates": True},
        headers=headers,
    )
    assert gen_res.status_code == 200
    scenarios = gen_res.json()
    assert len(scenarios) >= 3

    # 3. List Scenarios
    list_res = await client.get("/api/v1/threat-scenarios", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 3

    # 4. Compare Scenarios
    comp_res = await client.get(f"/api/v1/threat-scenarios/{sc_id}/compare", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert len(comp_data["scenarios"]) >= 3
    assert comp_data["highest_risk_scenario_id"] is not None


@pytest.mark.asyncio
async def test_tenant_isolation_attack_paths(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    other_org: Organization,
    admin_user: User,
):
    """User from Org A cannot access or create relationships across Org B's assets."""
    asset_b = Asset(
        id=uuid.uuid4(),
        organization_id=other_org.id,
        name="OrgB-Target",
        asset_type=AssetType.SERVER,
    )
    db_session.add(asset_b)
    await db_session.commit()

    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create relationship with Org B's asset
    res = await client.post(
        "/api/v1/network/relationships",
        json={
            "source_asset_id": str(asset_b.id),
            "destination_asset_id": str(asset_b.id),
            "port": 443,
        },
        headers=headers,
    )
    assert res.status_code == 404
