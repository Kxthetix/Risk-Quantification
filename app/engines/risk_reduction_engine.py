"""Risk Reduction & Remediation Simulation Engine (Phase 8)."""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.models.enums import RemediationType


@dataclass
class RiskReductionResult:
    """Quantitative pre- and post-remediation risk and financial impact deltas."""
    initial_risk: float
    residual_risk: float
    risk_reduction: float
    expected_loss_before: float
    expected_loss_after: float
    expected_loss_reduction: float
    roi: float  # %
    risk_reduction_per_rupee: float
    attack_paths_reduced: int
    tco: float


class RiskReductionEngine:
    """Simulates effect of applying patches, controls, and configuration changes on risk & finances."""

    @classmethod
    def simulate_reduction(
        cls,
        initial_risk: float,
        expected_loss: float,
        remediation_type: RemediationType = RemediationType.PATCH,
        control_effectiveness: float = 0.85,
        implementation_cost: float = 100000.0,
        annual_operating_cost: float = 0.0,
        horizon_years: int = 1,
        attack_paths_count: int = 1,
    ) -> RiskReductionResult:
        """Simulate applying a remediation action and compute financial & risk deltas."""
        # 1. Determine effectiveness by remediation type
        type_efficiency = {
            RemediationType.PATCH: 0.95,
            RemediationType.UPGRADE: 0.90,
            RemediationType.ASSET_RETIREMENT: 1.00,
            RemediationType.CONFIGURATION_CHANGE: 0.80,
            RemediationType.NETWORK_SEGMENTATION: 0.75,
            RemediationType.ACCESS_CONTROL: 0.70,
            RemediationType.MFA: 0.85,
            RemediationType.WAF_RULE: 0.65,
            RemediationType.FIREWALL_RULE: 0.75,
            RemediationType.VIRTUAL_PATCH: 0.70,
            RemediationType.COMPENSATING_CONTROL: 0.60,
        }.get(remediation_type, 0.75)

        # Composite reduction fraction
        eff_fraction = min(1.0, type_efficiency * (control_effectiveness or 0.85))

        # Residual Risk calculation
        risk_drop = initial_risk * eff_fraction
        residual_risk = max(0.0, round(initial_risk - risk_drop, 1))
        risk_reduction = round(initial_risk - residual_risk, 1)

        # Residual Financial Loss calculation
        loss_drop = expected_loss * eff_fraction
        expected_loss_after = max(0.0, round(expected_loss - loss_drop, 2))
        expected_loss_reduction = round(expected_loss - expected_loss_after, 2)

        # TCO calculation over horizon
        tco = implementation_cost + (annual_operating_cost * horizon_years)
        cost_metric = max(1000.0, tco if tco > 0 else implementation_cost)

        # ROI (%) calculation
        roi = round(((expected_loss_reduction - cost_metric) / cost_metric) * 100.0, 1)

        # Risk Reduction per Rupee (RRPR)
        rrpr = round(expected_loss_reduction / cost_metric, 2)

        # Attack paths reduced
        paths_reduced = max(1, int(attack_paths_count * eff_fraction)) if attack_paths_count > 0 else 0

        return RiskReductionResult(
            initial_risk=round(initial_risk, 1),
            residual_risk=residual_risk,
            risk_reduction=risk_reduction,
            expected_loss_before=round(expected_loss, 2),
            expected_loss_after=expected_loss_after,
            expected_loss_reduction=expected_loss_reduction,
            roi=roi,
            risk_reduction_per_rupee=rrpr,
            attack_paths_reduced=paths_reduced,
            tco=round(tco, 2),
        )
