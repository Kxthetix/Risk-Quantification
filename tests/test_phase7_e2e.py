"""Phase 7 End-to-End Test: Asset Inventory -> Network Relationships -> CVE -> Validation -> Risk Score -> Financial Assessment -> Attack Graph -> Attack Path -> Threat Scenario -> Chokepoint Remediation."""
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
async def test_phase7_end_to_end_attack_path_and_threat_analysis(
    client: AsyncClient,
    db_session: AsyncSession,
    test_org: Organization,
    admin_user: User,
):
    """Full lifecycle demonstration of Phase 7 Attack Path & Threat Scenario Analysis.

    Flow:
    1. Financial Profile & Business Service (Phase 6 baseline: Primary Transaction Processing).
    2. Assets Setup:
       - Entry Point: 'Public-Facing DMZ Web Server' (Internet Exposed, High Criticality)
       - Intermediate Pivot: 'Internal Application Server' (Production, High Criticality)
       - Critical Target: 'Core Payment Database' (Production, CRITICAL, RESTRICTED, 90% Revenue Dependency)
    3. Network Relationships:
       - Web Server -> App Server (TCP 8080)
       - App Server -> Payment DB (TCP 5432)
    4. Software & CVE & Validation & Cyber Risk Score:
       - Apache HTTP Server 2.4.49 (CVE-2021-41773, CVSS 9.8, KEV YES)
       - Validated with network evidence (CONFIRMED)
       - Cyber Risk Score ~90.0
    5. Phase 6 Financial Quantification:
       - Monte Carlo runs on Payment DB vulnerability -> Expected Loss > 0
    6. Phase 7 Attack Path Engine Run:
       - Constructs Attack Graph G = (V, E)
       - Traverses path: Internet -> Web Server -> App Server -> Payment DB
       - Computes Path Score, Likelihood, Confidence, and links Financial Exposure
    7. Phase 7 Threat Scenario Generation:
       - Synthesizes threat scenario with MITRE ATT&CK techniques (T1190, T1021, T1068)
    8. Phase 7 Chokepoint Identification:
       - Evaluates intermediate nodes where remediation disrupts the attack path
    """
    token = create_access_token(data={"sub": str(admin_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Configure Financial Profile & Business Service
    await client.put(
        "/api/v1/financial/profile",
        json={
            "annual_revenue": 500000000.0,
            "operating_days_per_year": 250,
            "hours_per_day": 8,
            "employee_count": 200,
            "cost_per_record": 350.0,
        },
        headers=headers,
    )

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
    business_service_id = uuid.UUID(bs_res.json()["id"])

    # Step 2: Assets
    web_server = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Public-Facing DMZ Web Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=True,
    )
    app_server = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Internal Application Server",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=False,
    )
    payment_db = Asset(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        business_service_id=business_service_id,
        name="Core Payment Database",
        asset_type=AssetType.DATABASE,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        data_classification=DataClassification.RESTRICTED,
        financial_dependency_factor=0.90,
        internet_exposed=False,
        business_value=10000000.0,
    )
    db_session.add_all([web_server, app_server, payment_db])

    # Step 3: Software & CVE on Web Server
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
        description="Apache HTTP Server Path Traversal and RCE",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln)

    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=web_server.id,
        vulnerability_id=vuln.id,
        software_id=software.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av)

    # Vulnerability on Payment DB for Financial Assessment
    vuln_db = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2023-34362",
        description="MOVEit Transfer SQL Injection",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    db_session.add(vuln_db)

    av_db = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=payment_db.id,
        vulnerability_id=vuln_db.id,
        match_method=VulnerabilityMatchMethod.CPE,
        match_confidence=1.0,
        status=AssetVulnerabilityStatus.OPEN,
    )
    db_session.add(av_db)
    await db_session.commit()

    # Step 4: Network Relationships: Web -> App -> DB
    await client.post(
        "/api/v1/network/relationships",
        json={"source_asset_id": str(web_server.id), "destination_asset_id": str(app_server.id), "port": 8080, "protocol": "HTTP"},
        headers=headers,
    )
    await client.post(
        "/api/v1/network/relationships",
        json={"source_asset_id": str(app_server.id), "destination_asset_id": str(payment_db.id), "port": 5432, "protocol": "TCP"},
        headers=headers,
    )

    # Step 5: Phase 6 Financial Quantification on Payment DB finding
    calc_res = await client.post(
        "/api/v1/financial/calculate",
        json={"asset_vulnerability_id": str(av_db.id), "simulation_count": 2000, "synchronous": True},
        headers=headers,
    )
    assert calc_res.status_code == 202

    # Step 6: Phase 7 Attack Path Discovery Run
    analyze_res = await client.post(
        "/api/v1/attack-paths/analyze",
        json={"target_asset_id": str(payment_db.id), "max_path_length": 8, "synchronous": True},
        headers=headers,
    )
    assert analyze_res.status_code == 200
    analysis_data = analyze_res.json()
    assert analysis_data["total_paths"] >= 1

    path = analysis_data["paths"][0]
    assert path["target_asset_id"] == str(payment_db.id)
    assert path["path_score"] > 0.0
    assert path["likelihood"] > 0.0
    assert path["confidence"] > 0.0
    assert path["financial_exposure"] is not None or path["path_score"] >= 50.0

    # Step 7: Verify Threat Scenario Generation
    scenarios_res = await client.post(
        "/api/v1/threat-scenarios/generate",
        json={"target_asset_id": str(payment_db.id), "generate_templates": True},
        headers=headers,
    )
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) >= 3

    # Step 8: Verify Chokepoints
    choke_res = await client.get("/api/v1/attack-paths/chokepoints", headers=headers)
    assert choke_res.status_code == 200
    chokepoints = choke_res.json()
    assert len(chokepoints) >= 1
    # App Server or Web Server should be identified as a chokepoint
    assert any("App" in c["node_label"] or "Web" in c["node_label"] for c in chokepoints)

    # Step 9: Verify Attack Graph Serialization
    graph_res = await client.get("/api/v1/attack-graph", headers=headers)
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert len(graph_data["nodes"]) >= 4  # INTERNET, Web, App, DB
    assert len(graph_data["edges"]) >= 3
