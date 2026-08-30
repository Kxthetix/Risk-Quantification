"""Threat Scenario Generation Engine (Phase 7)."""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import uuid

from app.engines.path_scoring_engine import DiscoveredPath
from app.models.enums import AttackerProfile, ThreatScenarioStatus


@dataclass
class ScenarioTemplate:
    """Predefined threat scenario definition."""
    name: str
    description: str
    attacker_profile: AttackerProfile
    objective: str
    techniques: List[str]
    default_probability: float
    default_confidence: float


# Catalog of standard adversary threat scenario templates
STANDARD_TEMPLATES = [
    ScenarioTemplate(
        name="Ransomware Deployment & Business Interruption",
        description="Adversary gains initial access via exposed web service, pivots laterally across internal network, compromises domain controller, and executes widespread data encryption.",
        attacker_profile=AttackerProfile.RANSOMWARE_GROUP,
        objective="Data Encryption & Extortion",
        techniques=["T1190", "T1068", "T1021", "T1486"],
        default_probability=0.65,
        default_confidence=0.85,
    ),
    ScenarioTemplate(
        name="Confidential Customer Data Exfiltration",
        description="External threat actor exploits unauthenticated application flaw, navigates to backend relational databases, and extracts regulated PII/payment data.",
        attacker_profile=AttackerProfile.EXTERNAL_ATTACKER,
        objective="Sensitive Data Exfiltration",
        techniques=["T1190", "T1005", "T1048"],
        default_probability=0.70,
        default_confidence=0.90,
    ),
    ScenarioTemplate(
        name="Insider / Compromised Account Privilege Escalation",
        description="Actor with low-privilege internal network access leverages misconfigurations and local kernel/service vulnerabilities to attain root/admin privileges.",
        attacker_profile=AttackerProfile.INSIDER,
        objective="Administrative Control & Critical Asset Access",
        techniques=["T1078", "T1068"],
        default_probability=0.45,
        default_confidence=0.80,
    ),
]


class ThreatScenarioEngine:
    """Generates threat scenarios from templates and discovered attack paths."""

    @classmethod
    def get_standard_templates(cls) -> List[ScenarioTemplate]:
        """Return predefined threat scenario templates."""
        return list(STANDARD_TEMPLATES)

    @classmethod
    def generate_from_attack_path(
        cls,
        path: DiscoveredPath,
        financial_assessment: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Synthesize a contextual threat scenario from a discovered attack path."""
        target_name = "Target Asset"
        if path.nodes:
            target_name = path.nodes[-1].label

        entry_name = "External Perimeter"
        if path.nodes:
            entry_name = path.nodes[0].label

        # Map techniques
        techniques = ["T1190"]
        if path.path_length > 2:
            techniques.append("T1021")  # Remote services / lateral movement
        if any("VULN" in n_id for n_id in path.node_ids):
            techniques.append("T1068")  # Exploitation for privilege escalation

        # Financial metrics from Phase 6
        expected_loss = 0.0
        p50_loss = 0.0
        p90_loss = 0.0
        fa_id = None
        if financial_assessment:
            fa_id = getattr(financial_assessment, "id", None)
            expected_loss = float(getattr(financial_assessment, "expected_loss", 0.0) or 0.0)
            p50_loss = float(getattr(financial_assessment, "p50_loss", 0.0) or 0.0)
            p90_loss = float(getattr(financial_assessment, "p90_loss", 0.0) or 0.0)

        scenario_name = f"Multi-Hop Intrusion to {target_name}"
        desc = (
            f"Adversary breaches perimeter via {entry_name}, navigates {path.path_length} hops "
            f"across internal network, and establishes unauthorized access on {target_name}."
        )

        return {
            "name": scenario_name,
            "description": desc,
            "attacker_profile": AttackerProfile.EXTERNAL_ATTACKER,
            "objective": f"Compromise {target_name}",
            "entry_point": entry_name,
            "target_asset_id": path.target_asset_id,
            "target_asset_name": target_name,
            "probability": path.likelihood,
            "confidence": path.confidence,
            "risk_score": path.path_score,
            "financial_assessment_id": fa_id,
            "expected_loss": expected_loss,
            "p50_loss": p50_loss,
            "p90_loss": p90_loss,
            "techniques": techniques,
            "status": ThreatScenarioStatus.ACTIVE,
            "scenario_metadata": {
                "path_length": path.path_length,
                "node_count": len(path.nodes),
                "is_blocked": path.is_blocked,
                "techniques": techniques,
            },
        }
