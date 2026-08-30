"""Path Discovery, Scoring, and Chokepoint Analysis Engine (Phase 7)."""
from dataclasses import dataclass, field
import heapq
import math
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.engines.attack_graph_engine import AttackGraph, GraphEdge, GraphNode
from app.models.enums import (
    AssetCriticality,
    AttackPathNodeType,
    AttackPathStatus,
)


@dataclass
class DiscoveredPath:
    """A scored attack path traversing through nodes and edges."""
    node_ids: List[str]
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    path_score: float
    likelihood: float
    impact: float
    confidence: float
    path_length: int
    status: AttackPathStatus
    is_blocked: bool = False
    blocking_control: Optional[str] = None
    target_node_id: str = ""
    target_asset_id: Optional[uuid.UUID] = None


@dataclass
class ChokepointFinding:
    """High-leverage node whose remediation disrupts multiple attack paths."""
    asset_id: Optional[uuid.UUID]
    node_id: str
    node_label: str
    node_type: str
    affected_paths_count: int
    critical_paths_count: int
    risk_reduction_potential: float


class PathScoringEngine:
    """Discovers paths, computes compounded likelihoods, and ranks chokepoints."""

    @classmethod
    def discover_paths(
        cls,
        graph: AttackGraph,
        max_path_length: int = 8,
        max_paths: int = 100,
        target_asset_id: Optional[uuid.UUID] = None,
    ) -> List[DiscoveredPath]:
        """Find all plausible attack paths from entry points to critical targets with cycle detection."""
        discovered: List[DiscoveredPath] = []

        # Determine target node IDs
        target_nodes: Set[str] = set()
        if target_asset_id:
            asset_node_id = f"ASSET_{target_asset_id}"
            if asset_node_id in graph.nodes:
                target_nodes.add(asset_node_id)
        else:
            target_nodes = set(graph.targets)
            if not target_nodes:
                # Fallback: all assets with non-entry points or any asset
                for n_id, node in graph.nodes.items():
                    if node.node_type in (AttackPathNodeType.ASSET, AttackPathNodeType.BUSINESS_SERVICE):
                        target_nodes.add(n_id)

        # Iterate over entry points
        entry_points = graph.entry_points or ["INTERNET"]
        for entry_id in entry_points:
            if entry_id not in graph.nodes:
                continue

            cls._dfs_paths(
                graph=graph,
                current_node_id=entry_id,
                target_nodes=target_nodes,
                current_path_nodes=[entry_id],
                current_path_edges=[],
                visited_nodes={entry_id},
                max_length=max_path_length,
                max_paths=max_paths,
                discovered=discovered,
            )

            if len(discovered) >= max_paths:
                break

        # Sort paths by path_score descending
        discovered.sort(key=lambda p: (not p.is_blocked, p.path_score), reverse=True)
        return discovered[:max_paths]

    @classmethod
    def _dfs_paths(
        cls,
        graph: AttackGraph,
        current_node_id: str,
        target_nodes: Set[str],
        current_path_nodes: List[str],
        current_path_edges: List[GraphEdge],
        visited_nodes: Set[str],
        max_length: int,
        max_paths: int,
        discovered: List[DiscoveredPath],
    ) -> None:
        """Recursive DFS path discovery with length limit and loop prevention."""
        if len(discovered) >= max_paths:
            return

        # Check if current node is a target (and path length > 1)
        if current_node_id in target_nodes and len(current_path_nodes) > 1:
            scored_path = cls._evaluate_path(graph, current_path_nodes, current_path_edges)
            discovered.append(scored_path)

        if len(current_path_nodes) >= max_length:
            return

        for edge in graph.adjacency.get(current_node_id, []):
            next_node_id = edge.destination_id
            if next_node_id not in visited_nodes:
                visited_nodes.add(next_node_id)
                current_path_nodes.append(next_node_id)
                current_path_edges.append(edge)

                cls._dfs_paths(
                    graph=graph,
                    current_node_id=next_node_id,
                    target_nodes=target_nodes,
                    current_path_nodes=current_path_nodes,
                    current_path_edges=current_path_edges,
                    visited_nodes=visited_nodes,
                    max_length=max_length,
                    max_paths=max_paths,
                    discovered=discovered,
                )

                current_path_edges.pop()
                current_path_nodes.pop()
                visited_nodes.remove(next_node_id)

    @classmethod
    def _evaluate_path(
        cls,
        graph: AttackGraph,
        node_ids: List[str],
        edges: List[GraphEdge],
    ) -> DiscoveredPath:
        """Score an individual discovered attack path."""
        nodes = [graph.nodes[n_id] for n_id in node_ids if n_id in graph.nodes]
        target_node = nodes[-1] if nodes else None

        # 1. Likelihood: Product of edge probabilities
        likelihood = 1.0
        for edge in edges:
            likelihood *= max(0.05, min(1.0, edge.probability))

        # 2. Confidence: Product of edge confidences
        confidence = 1.0
        for edge in edges:
            confidence *= max(0.1, min(1.0, edge.confidence))

        # 3. Check for blocking
        is_blocked = False
        blocking_control = None
        for edge in edges:
            if edge.is_blocked:
                is_blocked = True
                blocking_control = edge.blocking_reason or "Firewall / Control Blocked"
                break

        # 4. Impact: Target Asset criticality & sensitivity
        impact = 50.0
        target_asset_id = None
        if target_node:
            target_asset_id = target_node.asset_id
            if target_node.criticality == AssetCriticality.CRITICAL:
                impact = 100.0
            elif target_node.criticality == AssetCriticality.HIGH:
                impact = 80.0
            elif target_node.criticality == AssetCriticality.MEDIUM:
                impact = 55.0
            elif target_node.criticality == AssetCriticality.LOW:
                impact = 30.0

        # 5. Composite Path Score (0 to 100)
        if is_blocked:
            path_score = 0.0
            status = AttackPathStatus.BLOCKED
        else:
            # Score = Likelihood * Impact * (0.7 + 0.3 * Confidence)
            raw_score = likelihood * impact * (0.7 + 0.3 * confidence)
            path_score = round(max(0.0, min(100.0, raw_score)), 1)

            if confidence >= 0.8 and likelihood >= 0.4:
                status = AttackPathStatus.HIGH_CONFIDENCE
            else:
                status = AttackPathStatus.POSSIBLE

        return DiscoveredPath(
            node_ids=list(node_ids),
            nodes=nodes,
            edges=list(edges),
            path_score=path_score,
            likelihood=round(likelihood, 3),
            impact=round(impact, 1),
            confidence=round(confidence, 3),
            path_length=len(node_ids),
            status=status,
            is_blocked=is_blocked,
            blocking_control=blocking_control,
            target_node_id=target_node.node_id if target_node else "",
            target_asset_id=target_asset_id,
        )

    @classmethod
    def identify_chokepoints(cls, paths: List[DiscoveredPath]) -> List[ChokepointFinding]:
        """Find bottleneck nodes where mitigation eliminates the most high-severity attack paths."""
        if not paths:
            return []

        total_score_sum = sum(p.path_score for p in paths if not p.is_blocked)
        if total_score_sum <= 0.0:
            total_score_sum = 1.0

        # Map node_id -> {paths: count, critical_paths: count, disrupted_score: float}
        node_stats: Dict[str, Dict[str, Any]] = {}

        for path in paths:
            if path.is_blocked:
                continue

            # Intermediate nodes (exclude root INTERNET and final target)
            intermediates = path.nodes[1:-1] if len(path.nodes) > 2 else path.nodes
            is_critical_path = path.path_score >= 70.0

            for node in intermediates:
                n_id = node.node_id
                if n_id not in node_stats:
                    node_stats[n_id] = {
                        "node": node,
                        "affected_paths": 0,
                        "critical_paths": 0,
                        "disrupted_score": 0.0,
                    }
                node_stats[n_id]["affected_paths"] += 1
                if is_critical_path:
                    node_stats[n_id]["critical_paths"] += 1
                node_stats[n_id]["disrupted_score"] += path.path_score

        findings: List[ChokepointFinding] = []
        for n_id, stat in node_stats.items():
            node: GraphNode = stat["node"]
            reduction_pot = min(1.0, stat["disrupted_score"] / total_score_sum)
            findings.append(
                ChokepointFinding(
                    asset_id=node.asset_id,
                    node_id=node.node_id,
                    node_label=node.label,
                    node_type=node.node_type.value,
                    affected_paths_count=stat["affected_paths"],
                    critical_paths_count=stat["critical_paths"],
                    risk_reduction_potential=round(reduction_pot, 2),
                )
            )

        # Sort by affected_paths_count and risk_reduction_potential descending
        findings.sort(key=lambda f: (f.critical_paths_count, f.risk_reduction_potential), reverse=True)
        return findings
