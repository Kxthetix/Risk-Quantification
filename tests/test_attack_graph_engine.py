"""Unit tests for Phase 7 Attack Graph Construction Engine."""
import uuid
import pytest

from app.engines.attack_graph_engine import AttackGraphEngine
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.business_service import BusinessService
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetType,
    AttackPathEdgeType,
    AttackPathNodeType,
    DataClassification,
    ExploitAvailability,
    NetworkDirection,
    NetworkRelationshipType,
    VulnerabilityMatchMethod,
    VulnerabilitySeverity,
)
from app.models.network_relationship import NetworkRelationship
from app.models.vulnerability import Vulnerability


def test_entry_point_identification():
    """Verify internet-exposed assets are recognized as entry points."""
    exposed_asset = Asset(
        id=uuid.uuid4(),
        name="Public-Web",
        asset_type=AssetType.SERVER,
        internet_exposed=True,
    )
    internal_asset = Asset(
        id=uuid.uuid4(),
        name="Internal-DB",
        asset_type=AssetType.DATABASE,
        internet_exposed=False,
    )

    assert AttackGraphEngine.is_entry_point_asset(exposed_asset) is True
    assert AttackGraphEngine.is_entry_point_asset(internal_asset) is False


def test_attack_graph_construction_and_nodes():
    """Verify in-memory graph G = (V, E) includes entry points, assets, vulns, and services."""
    org_id = uuid.uuid4()

    # Assets
    web_asset = Asset(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Web-Server-01",
        asset_type=AssetType.SERVER,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.HIGH,
        internet_exposed=True,
    )
    db_asset = Asset(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Core-Database-01",
        asset_type=AssetType.DATABASE,
        environment=AssetEnvironment.PRODUCTION,
        criticality=AssetCriticality.CRITICAL,
        internet_exposed=False,
    )

    # Vulnerability on Web
    vuln = Vulnerability(
        id=uuid.uuid4(),
        cve_id="CVE-2021-41773",
        severity=VulnerabilitySeverity.CRITICAL,
        cvss_score=9.8,
        known_exploited=True,
        exploit_available=ExploitAvailability.YES,
    )
    av = AssetVulnerability(
        id=uuid.uuid4(),
        asset_id=web_asset.id,
        vulnerability_id=vuln.id,
        vulnerability=vuln,
        match_method=VulnerabilityMatchMethod.CPE,
    )

    # Network relationship Web -> DB
    rel = NetworkRelationship(
        id=uuid.uuid4(),
        organization_id=org_id,
        source_asset_id=web_asset.id,
        destination_asset_id=db_asset.id,
        relationship_type=NetworkRelationshipType.NETWORK_REACHABILITY,
        protocol="TCP",
        port=5432,
        direction=NetworkDirection.OUTBOUND,
        verified=True,
        confidence=0.9,
    )

    # Business Service
    bs = BusinessService(
        id=uuid.uuid4(),
        organization_id=org_id,
        name="Payment Processing Service",
        criticality=AssetCriticality.CRITICAL,
        revenue_dependency=1.0,
    )
    db_asset.business_service_id = bs.id

    # Build graph
    graph = AttackGraphEngine.build_graph(
        assets=[web_asset, db_asset],
        network_relationships=[rel],
        asset_vulnerabilities=[av],
        business_services=[bs],
    )

    # Assertions
    assert "INTERNET" in graph.nodes
    assert f"ASSET_{web_asset.id}" in graph.nodes
    assert f"ASSET_{db_asset.id}" in graph.nodes
    assert f"VULN_{av.id}" in graph.nodes
    assert f"SERVICE_{bs.id}" in graph.nodes

    # Entry points and targets
    assert "INTERNET" in graph.entry_points
    assert f"ASSET_{web_asset.id}" in graph.entry_points
    assert f"ASSET_{db_asset.id}" in graph.targets

    # Check edges
    edge_types = [e.edge_type for e in graph.edges]
    assert AttackPathEdgeType.REACHES in edge_types
    assert AttackPathEdgeType.EXPLOITS in edge_types
    assert AttackPathEdgeType.LATERAL_MOVEMENT in edge_types
    assert AttackPathEdgeType.ACCESSES in edge_types


def test_attack_graph_serialization_for_visualization():
    """Verify graph serialization format matching frontend Cytoscape / D3 requirements."""
    asset = Asset(
        id=uuid.uuid4(),
        name="API-Gateway",
        asset_type=AssetType.API,
        criticality=AssetCriticality.MEDIUM,
        internet_exposed=True,
    )
    graph = AttackGraphEngine.build_graph(assets=[asset], network_relationships=[])
    serialized = AttackGraphEngine.serialize_for_visualization(graph)

    assert "nodes" in serialized
    assert "edges" in serialized
    assert len(serialized["nodes"]) >= 2  # INTERNET + API-Gateway
    assert len(serialized["edges"]) >= 1  # INTERNET -> API-Gateway
