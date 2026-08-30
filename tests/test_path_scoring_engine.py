"""Unit and algorithm tests for Path Scoring Engine, Cycle Detection, and Chokepoint Analysis."""
import uuid
# pyrefly: ignore [missing-import]
import pytest

from app.engines.attack_graph_engine import AttackGraph, GraphEdge, GraphNode
from app.engines.path_scoring_engine import PathScoringEngine
from app.models.enums import (
    AssetCriticality,
    AttackPathEdgeType,
    AttackPathNodeType,
    AttackPathStatus,
)


def test_linear_path_discovery():
    """Verify discovery of simple multi-hop attack path."""
    graph = AttackGraph()

    # Nodes: Internet -> Web -> App -> DB (Critical)
    graph.add_node(GraphNode(node_id="INTERNET", node_type=AttackPathNodeType.ENTRY_POINT, label="Internet", is_entry_point=True))
    graph.add_node(GraphNode(node_id="WEB", node_type=AttackPathNodeType.ASSET, label="Web Server", criticality=AssetCriticality.HIGH, is_entry_point=True))
    graph.add_node(GraphNode(node_id="APP", node_type=AttackPathNodeType.ASSET, label="App Server", criticality=AssetCriticality.MEDIUM))
    graph.add_node(GraphNode(node_id="DB", node_type=AttackPathNodeType.ASSET, label="Database", criticality=AssetCriticality.CRITICAL))

    # Edges
    graph.add_edge(GraphEdge(source_id="INTERNET", destination_id="WEB", edge_type=AttackPathEdgeType.REACHES, probability=1.0, confidence=1.0))
    graph.add_edge(GraphEdge(source_id="WEB", destination_id="APP", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.8, confidence=0.9))
    graph.add_edge(GraphEdge(source_id="APP", destination_id="DB", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.9, confidence=0.95))

    paths = PathScoringEngine.discover_paths(graph=graph, max_path_length=8)

    assert len(paths) >= 1
    best_path = paths[0]
    assert best_path.node_ids == ["INTERNET", "WEB", "APP", "DB"]
    assert best_path.path_length == 4
    assert best_path.status == AttackPathStatus.HIGH_CONFIDENCE
    assert best_path.path_score > 50.0
    assert best_path.is_blocked is False


def test_blocked_path_handling():
    """When a security control or firewall breaks an edge, path is marked BLOCKED."""
    graph = AttackGraph()

    graph.add_node(GraphNode(node_id="INTERNET", node_type=AttackPathNodeType.ENTRY_POINT, label="Internet", is_entry_point=True))
    graph.add_node(GraphNode(node_id="WEB", node_type=AttackPathNodeType.ASSET, label="Web Server", criticality=AssetCriticality.HIGH, is_entry_point=True))
    graph.add_node(GraphNode(node_id="DB", node_type=AttackPathNodeType.ASSET, label="Database", criticality=AssetCriticality.CRITICAL))

    graph.add_edge(GraphEdge(source_id="INTERNET", destination_id="WEB", edge_type=AttackPathEdgeType.REACHES, probability=1.0, confidence=1.0))
    # Blocked edge by firewall
    graph.add_edge(GraphEdge(
        source_id="WEB",
        destination_id="DB",
        edge_type=AttackPathEdgeType.LATERAL_MOVEMENT,
        probability=0.0,
        confidence=1.0,
        is_blocked=True,
        blocking_reason="Firewall Rule: Port 5432 Ingress Denied from DMZ",
    ))

    paths = PathScoringEngine.discover_paths(graph=graph)

    assert len(paths) >= 1
    blocked_p = paths[0]
    assert blocked_p.is_blocked is True
    assert blocked_p.status == AttackPathStatus.BLOCKED
    assert blocked_p.path_score == 0.0
    assert "Firewall Rule" in (blocked_p.blocking_control or "")


def test_circular_graph_cycle_prevention():
    """Verify graph traversal handles cycles (A -> B -> C -> A) without infinite loops."""
    graph = AttackGraph()

    graph.add_node(GraphNode(node_id="INTERNET", node_type=AttackPathNodeType.ENTRY_POINT, label="Internet", is_entry_point=True))
    graph.add_node(GraphNode(node_id="NODE_A", node_type=AttackPathNodeType.ASSET, label="A"))
    graph.add_node(GraphNode(node_id="NODE_B", node_type=AttackPathNodeType.ASSET, label="B"))
    graph.add_node(GraphNode(node_id="NODE_C", node_type=AttackPathNodeType.ASSET, label="C", criticality=AssetCriticality.CRITICAL))

    # Cycle: Internet -> A -> B -> C -> A
    graph.add_edge(GraphEdge(source_id="INTERNET", destination_id="NODE_A", edge_type=AttackPathEdgeType.REACHES, probability=1.0))
    graph.add_edge(GraphEdge(source_id="NODE_A", destination_id="NODE_B", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.8))
    graph.add_edge(GraphEdge(source_id="NODE_B", destination_id="NODE_C", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.8))
    graph.add_edge(GraphEdge(source_id="NODE_C", destination_id="NODE_A", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.8))  # Loop back

    # Must complete cleanly without recursion limit error
    paths = PathScoringEngine.discover_paths(graph=graph, max_path_length=8)
    assert len(paths) >= 1
    assert paths[0].node_ids == ["INTERNET", "NODE_A", "NODE_B", "NODE_C"]


def test_chokepoint_identification():
    """Identify bottleneck intermediate node appearing across multiple attack paths."""
    graph = AttackGraph()

    # 2 Entry points converging on APP_SERVER -> 2 target DBs
    # Web-1 -> App-Server -> DB-1
    # Web-2 -> App-Server -> DB-2
    graph.add_node(GraphNode(node_id="WEB_1", node_type=AttackPathNodeType.ENTRY_POINT, label="Web-1", is_entry_point=True))
    graph.add_node(GraphNode(node_id="WEB_2", node_type=AttackPathNodeType.ENTRY_POINT, label="Web-2", is_entry_point=True))
    graph.add_node(GraphNode(node_id="APP_SERVER", node_type=AttackPathNodeType.ASSET, label="Shared Application Server", criticality=AssetCriticality.HIGH))
    graph.add_node(GraphNode(node_id="DB_1", node_type=AttackPathNodeType.ASSET, label="Customer DB", criticality=AssetCriticality.CRITICAL))
    graph.add_node(GraphNode(node_id="DB_2", node_type=AttackPathNodeType.ASSET, label="Payment DB", criticality=AssetCriticality.CRITICAL))

    graph.add_edge(GraphEdge(source_id="WEB_1", destination_id="APP_SERVER", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.9, confidence=0.9))
    graph.add_edge(GraphEdge(source_id="WEB_2", destination_id="APP_SERVER", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.9, confidence=0.9))
    graph.add_edge(GraphEdge(source_id="APP_SERVER", destination_id="DB_1", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.9, confidence=0.9))
    graph.add_edge(GraphEdge(source_id="APP_SERVER", destination_id="DB_2", edge_type=AttackPathEdgeType.LATERAL_MOVEMENT, probability=0.9, confidence=0.9))

    paths = PathScoringEngine.discover_paths(graph=graph)
    assert len(paths) >= 2

    chokepoints = PathScoringEngine.identify_chokepoints(paths)
    assert len(chokepoints) >= 1
    top_choke = chokepoints[0]
    assert top_choke.node_id == "APP_SERVER"
    assert top_choke.affected_paths_count >= 2
    assert top_choke.risk_reduction_potential > 0.5
