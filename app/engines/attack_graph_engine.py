"""Attack Graph Construction Engine (Phase 7).

Constructs an in-memory directed graph G = (V, E) from:
- Assets & network exposure
- Vulnerabilities & empirical validation confidence
- Network relationships & directional reachability
- Security controls & compensating controls
- Identities, privileges, and business services
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set
import uuid

from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.business_service import BusinessService
from app.models.enums import (
    AssetCriticality,
    AttackPathEdgeType,
    AttackPathNodeType,
    DataClassification,
    ExploitAvailability,
    NetworkRelationshipType,
    ValidationStatus,
)
from app.models.network_relationship import NetworkRelationship
from app.models.vulnerability import Vulnerability


@dataclass
class GraphNode:
    """Discrete node in the security attack graph."""
    node_id: str
    node_type: AttackPathNodeType
    label: str
    asset_id: Optional[uuid.UUID] = None
    vulnerability_id: Optional[uuid.UUID] = None
    service_id: Optional[uuid.UUID] = None
    criticality: Optional[AssetCriticality] = None
    risk_score: float = 0.0
    is_entry_point: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphEdge:
    """Directional transition edge between two graph nodes."""
    source_id: str
    destination_id: str
    edge_type: AttackPathEdgeType
    probability: float = 1.0
    confidence: float = 1.0
    is_blocked: bool = False
    blocking_reason: Optional[str] = None
    evidence: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AttackGraph:
    """Complete directed attack graph G = (V, E)."""
    nodes: Dict[str, GraphNode] = field(default_factory=dict)
    edges: List[GraphEdge] = field(default_factory=list)
    adjacency: Dict[str, List[GraphEdge]] = field(default_factory=dict)
    entry_points: List[str] = field(default_factory=list)
    targets: List[str] = field(default_factory=list)

    def add_node(self, node: GraphNode) -> None:
        self.nodes[node.node_id] = node
        if node.node_id not in self.adjacency:
            self.adjacency[node.node_id] = []
        if node.is_entry_point and node.node_id not in self.entry_points:
            self.entry_points.append(node.node_id)
        if (node.criticality in (AssetCriticality.HIGH, AssetCriticality.CRITICAL) or node.node_type in (AttackPathNodeType.TARGET, AttackPathNodeType.BUSINESS_SERVICE)) and not node.is_entry_point:
            if node.node_id not in self.targets:
                self.targets.append(node.node_id)

    def add_edge(self, edge: GraphEdge) -> None:
        self.edges.append(edge)
        if edge.source_id not in self.adjacency:
            self.adjacency[edge.source_id] = []
        self.adjacency[edge.source_id].append(edge)


class AttackGraphEngine:
    """Builds and manages the directed cyber attack graph."""

    @staticmethod
    def is_entry_point_asset(asset: Asset) -> bool:
        """Determine if an asset qualifies as an initial attacker entry point."""
        if getattr(asset, "internet_exposed", False):
            return True
        # Check environment or public tags
        if asset.environment and asset.environment.value == "PRODUCTION":
            if getattr(asset, "data_classification", None) == DataClassification.PUBLIC:
                return True
        return False

    @classmethod
    def build_graph(
        cls,
        assets: List[Asset],
        network_relationships: List[NetworkRelationship],
        asset_vulnerabilities: Optional[List[AssetVulnerability]] = None,
        business_services: Optional[List[BusinessService]] = None,
        security_controls: Optional[List[Dict[str, Any]]] = None,
    ) -> AttackGraph:
        """Construct graph G = (V, E) with all assets, vulnerabilities, and reachability."""
        graph = AttackGraph()
        asset_map = {a.id: a for a in assets}

        # 1. Virtual Internet Node (Initial Adversary Root)
        internet_node = GraphNode(
            node_id="INTERNET",
            node_type=AttackPathNodeType.ENTRY_POINT,
            label="Public Internet",
            is_entry_point=True,
            risk_score=100.0,
            metadata={"description": "External untrusted adversary starting point"},
        )
        graph.add_node(internet_node)

        # 2. Add Asset Nodes
        for asset in assets:
            is_entry = cls.is_entry_point_asset(asset)
            asset_node_id = f"ASSET_{asset.id}"

            # Calculate base score
            criticality_weight = {
                AssetCriticality.LOW: 25.0,
                AssetCriticality.MEDIUM: 50.0,
                AssetCriticality.HIGH: 75.0,
                AssetCriticality.CRITICAL: 100.0,
            }.get(asset.criticality, 50.0)

            node = GraphNode(
                node_id=asset_node_id,
                node_type=AttackPathNodeType.ASSET,
                label=asset.name,
                asset_id=asset.id,
                criticality=asset.criticality,
                risk_score=criticality_weight,
                is_entry_point=is_entry,
                metadata={
                    "asset_type": asset.asset_type.value if asset.asset_type else "UNKNOWN",
                    "environment": asset.environment.value if asset.environment else "UNKNOWN",
                    "data_classification": asset.data_classification.value if asset.data_classification else "INTERNAL",
                    "internet_exposed": getattr(asset, "internet_exposed", False),
                },
            )
            graph.add_node(node)

            # If internet exposed, add edge from Internet -> Asset
            if is_entry:
                edge = GraphEdge(
                    source_id="INTERNET",
                    destination_id=asset_node_id,
                    edge_type=AttackPathEdgeType.REACHES,
                    probability=1.0,
                    confidence=1.0,
                    evidence={"source": "Asset Inventory Internet Exposure"},
                )
                graph.add_edge(edge)

        # 3. Add Vulnerability Nodes and Exploitation Edges
        if asset_vulnerabilities:
            for av in asset_vulnerabilities:
                if not av.asset_id or av.asset_id not in asset_map:
                    continue
                vuln: Optional[Vulnerability] = av.vulnerability
                if not vuln:
                    continue

                vuln_node_id = f"VULN_{av.id}"
                cve_id = vuln.cve_id or "CVE-UNKNOWN"

                # Calculate exploitability probability
                exploit_prob = 0.5
                if vuln.known_exploited:
                    exploit_prob = 0.95
                elif vuln.exploit_available == ExploitAvailability.YES:
                    exploit_prob = 0.85
                elif vuln.exploit_available == ExploitAvailability.NO:
                    exploit_prob = 0.35

                # Validation confidence
                val_conf = getattr(av, "validation_confidence", 0.8) or 0.8

                vuln_node = GraphNode(
                    node_id=vuln_node_id,
                    node_type=AttackPathNodeType.VULNERABILITY,
                    label=f"{cve_id} ({vuln.severity.value if vuln.severity else 'HIGH'})",
                    asset_id=av.asset_id,
                    vulnerability_id=vuln.id,
                    risk_score=float(vuln.cvss_score or 7.5) * 10.0,
                    metadata={
                        "cve_id": cve_id,
                        "cvss_score": vuln.cvss_score,
                        "known_exploited": vuln.known_exploited,
                        "exploit_available": vuln.exploit_available.value if vuln.exploit_available else "UNKNOWN",
                        "validation_confidence": val_conf,
                    },
                )
                graph.add_node(vuln_node)

                # Edge: Asset -> Vulnerability (or direct exploit on Asset)
                asset_node_id = f"ASSET_{av.asset_id}"
                exploit_edge = GraphEdge(
                    source_id=asset_node_id,
                    destination_id=vuln_node_id,
                    edge_type=AttackPathEdgeType.EXPLOITS,
                    probability=exploit_prob,
                    confidence=val_conf,
                    evidence={
                        "cve_id": cve_id,
                        "validation_status": getattr(av, "validation_status", "CONFIRMED"),
                    },
                )
                graph.add_edge(exploit_edge)

        # 4. Add Network Relationships (Lateral Movement / Reachability Edges)
        for rel in network_relationships:
            src_node_id = f"ASSET_{rel.source_asset_id}"
            dst_node_id = f"ASSET_{rel.destination_asset_id}"

            if src_node_id in graph.nodes and dst_node_id in graph.nodes:
                # Check for compensating controls
                is_blocked = False
                blocking_reason = None
                if security_controls:
                    for ctrl in security_controls:
                        if ctrl.get("source_asset_id") == str(rel.source_asset_id) and ctrl.get("dest_asset_id") == str(rel.destination_asset_id):
                            if ctrl.get("blocks_traffic", False):
                                is_blocked = True
                                blocking_reason = ctrl.get("description", "Security control blocked traffic")
                                break

                edge = GraphEdge(
                    source_id=src_node_id,
                    destination_id=dst_node_id,
                    edge_type=AttackPathEdgeType.LATERAL_MOVEMENT if rel.relationship_type == NetworkRelationshipType.NETWORK_REACHABILITY else AttackPathEdgeType.REACHES,
                    probability=0.9 if rel.verified else 0.6,
                    confidence=rel.confidence,
                    is_blocked=is_blocked,
                    blocking_reason=blocking_reason,
                    evidence=rel.evidence or {
                        "relationship_type": rel.relationship_type.value,
                        "protocol": rel.protocol,
                        "port": rel.port,
                        "direction": rel.direction.value,
                    },
                )
                graph.add_edge(edge)

        # 5. Add Business Service Target Nodes
        if business_services:
            for bs in business_services:
                bs_node_id = f"SERVICE_{bs.id}"
                bs_node = GraphNode(
                    node_id=bs_node_id,
                    node_type=AttackPathNodeType.BUSINESS_SERVICE,
                    label=bs.name,
                    service_id=bs.id,
                    criticality=bs.criticality,
                    risk_score=100.0 if bs.criticality == AssetCriticality.CRITICAL else 80.0,
                    metadata={
                        "revenue_dependency": bs.revenue_dependency,
                        "daily_transactions": bs.daily_transaction_count,
                    },
                )
                graph.add_node(bs_node)

                # Link Assets belonging to this service -> Business Service
                for asset in assets:
                    if getattr(asset, "business_service_id", None) == bs.id:
                        asset_node_id = f"ASSET_{asset.id}"
                        service_edge = GraphEdge(
                            source_id=asset_node_id,
                            destination_id=bs_node_id,
                            edge_type=AttackPathEdgeType.ACCESSES,
                            probability=1.0,
                            confidence=1.0,
                            evidence={"dependency": "Business Service Mapping"},
                        )
                        graph.add_edge(service_edge)

        return graph

    @classmethod
    def serialize_for_visualization(cls, graph: AttackGraph) -> Dict[str, Any]:
        """Convert AttackGraph to JSON structure suitable for cytoscape / D3 graph rendering."""
        nodes = []
        for n_id, n in graph.nodes.items():
            nodes.append({
                "id": n.node_id,
                "label": n.label,
                "type": n.node_type.value,
                "asset_id": str(n.asset_id) if n.asset_id else None,
                "vulnerability_id": str(n.vulnerability_id) if n.vulnerability_id else None,
                "criticality": n.criticality.value if n.criticality else None,
                "risk_score": round(n.risk_score, 1),
                "is_entry_point": n.is_entry_point,
                "metadata": n.metadata,
            })

        edges = []
        for idx, e in enumerate(graph.edges):
            edges.append({
                "id": f"edge_{idx}",
                "source": e.source_id,
                "target": e.destination_id,
                "type": e.edge_type.value,
                "probability": round(e.probability, 2),
                "confidence": round(e.confidence, 2),
                "is_blocked": e.is_blocked,
                "blocking_reason": e.blocking_reason,
            })

        return {"nodes": nodes, "edges": edges}
