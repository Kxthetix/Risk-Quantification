"""Unit tests for Phase 7 Threat Scenario Generation Engine."""
import uuid
import pytest

from app.engines.attack_graph_engine import GraphEdge, GraphNode
from app.engines.path_scoring_engine import DiscoveredPath
from app.engines.threat_scenario_engine import ThreatScenarioEngine
from app.models.enums import (
    AssetCriticality,
    AttackPathNodeType,
    AttackPathStatus,
    AttackerProfile,
)
from app.models.financial_assessment import FinancialAssessment


def test_standard_templates():
    """Verify catalog of standard predefined threat scenario templates."""
    templates = ThreatScenarioEngine.get_standard_templates()
    assert len(templates) >= 3

    names = [t.name for t in templates]
    assert any("Ransomware" in name for name in names)
    assert any("Exfiltration" in name for name in names)
    assert any("Privilege Escalation" in name for name in names)

    ransomware = next(t for t in templates if "Ransomware" in t.name)
    assert ransomware.attacker_profile == AttackerProfile.RANSOMWARE_GROUP
    assert "T1190" in ransomware.techniques
    assert "T1486" in ransomware.techniques


def test_generate_scenario_from_discovered_path():
    """Verify synthesis of threat scenario from a discovered path and Phase 6 financial assessment."""
    target_id = uuid.uuid4()
    path = DiscoveredPath(
        node_ids=["INTERNET", "WEB", "DB"],
        nodes=[
            GraphNode(node_id="INTERNET", node_type=AttackPathNodeType.ENTRY_POINT, label="Internet"),
            GraphNode(node_id="WEB", node_type=AttackPathNodeType.ASSET, label="Web Gateway"),
            GraphNode(node_id="DB", node_type=AttackPathNodeType.ASSET, label="Core Payment DB", asset_id=target_id, criticality=AssetCriticality.CRITICAL),
        ],
        edges=[],
        path_score=88.5,
        likelihood=0.62,
        impact=100.0,
        confidence=0.90,
        path_length=3,
        status=AttackPathStatus.HIGH_CONFIDENCE,
        target_asset_id=target_id,
    )

    fa = FinancialAssessment(
        id=uuid.uuid4(),
        organization_id=uuid.uuid4(),
        asset_id=target_id,
        expected_loss=4500000.0,
        p50_loss=3800000.0,
        p90_loss=8200000.0,
    )

    scenario_dict = ThreatScenarioEngine.generate_from_attack_path(path=path, financial_assessment=fa)

    assert "Core Payment DB" in scenario_dict["name"]
    assert scenario_dict["target_asset_id"] == target_id
    assert scenario_dict["risk_score"] == 88.5
    assert scenario_dict["expected_loss"] == 4500000.0
    assert scenario_dict["p90_loss"] == 8200000.0
    assert "T1190" in scenario_dict["techniques"]
