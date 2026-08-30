"""Remediation Priority Engine (Phase 8).

Computes contextual remediation priority based on:
- Cyber Risk Score (30%)
- Financial Exposure (20%)
- Attack Path Importance & Chokepoint Leverage (15%)
- Asset Criticality (10%)
- Exploitability (10%)
- Known Exploitation / KEV (10%)
- Validation Confidence (5%)
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.models.enums import (
    AssetCriticality,
    ExploitAvailability,
    RemediationPriorityLevel,
)


@dataclass
class RemediationWeightConfig:
    """Configurable weights for multi-factor priority scoring."""
    risk_weight: float = 0.30
    financial_weight: float = 0.20
    attack_path_weight: float = 0.15
    criticality_weight: float = 0.10
    exploitability_weight: float = 0.10
    known_exploited_weight: float = 0.10
    validation_weight: float = 0.05


@dataclass
class FindingContext:
    """Consolidated risk, financial, and attack graph context for a single finding."""
    risk_score: float = 0.0  # 0 to 100
    expected_loss: float = 0.0  # ₹
    p90_loss: float = 0.0  # ₹
    max_portfolio_loss: float = 10000000.0  # Normalized reference
    attack_path_count: int = 0
    max_attack_path_score: float = 0.0  # 0 to 100
    is_chokepoint: bool = False
    chokepoint_reduction_potential: float = 0.0  # 0 to 1.0
    criticality: AssetCriticality = AssetCriticality.MEDIUM
    exploit_available: ExploitAvailability = ExploitAvailability.UNKNOWN
    known_exploited: bool = False
    validation_confidence: float = 0.8  # 0 to 1.0
    is_internet_exposed: bool = False
    estimated_cost: float = 0.0  # ₹


@dataclass
class PriorityResult:
    """Computed multi-factor priority score, level, and transparent justifications."""
    priority_score: float
    priority_level: RemediationPriorityLevel
    justifications: List[str]
    factor_breakdown: Dict[str, float]


class RemediationPriorityEngine:
    """Calculates factual, contextual remediation priorities and explanations."""

    @classmethod
    def calculate_priority(
        cls,
        context: FindingContext,
        config: Optional[RemediationWeightConfig] = None,
    ) -> PriorityResult:
        """Compute normalized priority score and structured explanation."""
        if config is None:
            config = RemediationWeightConfig()

        # 1. Cyber Risk Score factor (0 to 100)
        norm_risk = max(0.0, min(100.0, context.risk_score))

        # 2. Financial Exposure factor (0 to 100)
        ref_loss = max(100000.0, context.max_portfolio_loss)
        fin_metric = max(context.expected_loss, context.p90_loss * 0.7)
        norm_financial = min(100.0, (fin_metric / ref_loss) * 100.0)

        # 3. Attack Path Importance (0 to 100)
        path_density = min(50.0, context.attack_path_count * 10.0)
        path_severity = context.max_attack_path_score * 0.3
        choke_bonus = (context.chokepoint_reduction_potential * 100.0) * 0.2 if context.is_chokepoint else 0.0
        norm_path = min(100.0, path_density + path_severity + choke_bonus)

        # 4. Asset Criticality (0 to 100)
        crit_map = {
            AssetCriticality.LOW: 25.0,
            AssetCriticality.MEDIUM: 50.0,
            AssetCriticality.HIGH: 75.0,
            AssetCriticality.CRITICAL: 100.0,
        }
        norm_criticality = crit_map.get(context.criticality, 50.0)

        # 5. Exploitability (0 to 100)
        exploit_map = {
            ExploitAvailability.NO: 25.0,
            ExploitAvailability.UNKNOWN: 50.0,
            ExploitAvailability.YES: 100.0,
        }
        norm_exploit = exploit_map.get(context.exploit_available, 50.0)

        # 6. Known Exploited Status (0 or 100)
        norm_kev = 100.0 if context.known_exploited else 0.0

        # 7. Validation Confidence (0 to 100)
        norm_validation = max(0.0, min(100.0, context.validation_confidence * 100.0))

        # Composite Weighted Score
        weighted_score = (
            (norm_risk * config.risk_weight)
            + (norm_financial * config.financial_weight)
            + (norm_path * config.attack_path_weight)
            + (norm_criticality * config.criticality_weight)
            + (norm_exploit * config.exploitability_weight)
            + (norm_kev * config.known_exploited_weight)
            + (norm_validation * config.validation_weight)
        )

        # Cost-benefit adjustment: Low cost with high risk gets a minor boost (+5)
        if context.estimated_cost > 0 and context.expected_loss > (context.estimated_cost * 5):
            weighted_score = min(100.0, weighted_score + 5.0)

        priority_score = round(max(0.0, min(100.0, weighted_score)), 1)

        # Map to Priority Level
        if priority_score >= 80.0:
            priority_level = RemediationPriorityLevel.CRITICAL
        elif priority_score >= 60.0:
            priority_level = RemediationPriorityLevel.HIGH
        elif priority_score >= 40.0:
            priority_level = RemediationPriorityLevel.MEDIUM
        else:
            priority_level = RemediationPriorityLevel.LOW

        # Generate Justifications
        justifications = []
        if context.criticality in (AssetCriticality.HIGH, AssetCriticality.CRITICAL):
            justifications.append(f"Vulnerability resides on a {context.criticality.value} business asset.")
        if context.is_internet_exposed:
            justifications.append("Asset is directly exposed to the public Internet.")
        if context.known_exploited:
            justifications.append("Vulnerability is actively weaponized and listed on CISA KEV.")
        if context.attack_path_count > 0:
            justifications.append(f"Vulnerability appears across {context.attack_path_count} viable attack paths (max path severity: {context.max_attack_path_score:.1f}).")
        if context.is_chokepoint:
            justifications.append(f"Identified as a critical bottleneck node with {context.chokepoint_reduction_potential*100:.0f}% risk reduction leverage.")
        if context.expected_loss > 500000.0:
            justifications.append(f"Financial exposure is elevated with ₹{context.expected_loss:,.0f} expected annual loss.")
        if context.estimated_cost > 0 and context.expected_loss > (context.estimated_cost * 2):
            roi_est = ((context.expected_loss - context.estimated_cost) / context.estimated_cost) * 100
            justifications.append(f"Remediation delivers high modeled financial ROI ({roi_est:.0f}%).")

        return PriorityResult(
            priority_score=priority_score,
            priority_level=priority_level,
            justifications=justifications,
            factor_breakdown={
                "cyber_risk": round(norm_risk, 1),
                "financial_exposure": round(norm_financial, 1),
                "attack_path_importance": round(norm_path, 1),
                "asset_criticality": round(norm_criticality, 1),
                "exploitability": round(norm_exploit, 1),
                "known_exploitation": round(norm_kev, 1),
                "validation_confidence": round(norm_validation, 1),
            },
        )
