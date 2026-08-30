"""Unit tests for Risk Reduction Engine & Financial ROI math (Phase 8)."""
import pytest

from app.engines.risk_reduction_engine import RiskReductionEngine
from app.models.enums import RemediationType


def test_simulate_patch_reduction():
    """Verify that applying a PATCH reduces risk and financial loss by ~95%."""
    initial_risk = 80.0
    expected_loss = 1000000.0  # ₹10L
    cost = 100000.0  # ₹1L

    res = RiskReductionEngine.simulate_reduction(
        initial_risk=initial_risk,
        expected_loss=expected_loss,
        remediation_type=RemediationType.PATCH,
        control_effectiveness=1.0,
        implementation_cost=cost,
        annual_operating_cost=0.0,
        horizon_years=1,
        attack_paths_count=3,
    )

    assert res.residual_risk <= 5.0
    assert res.risk_reduction >= 75.0
    assert res.expected_loss_reduction >= 900000.0
    # ROI = (950,000 - 100,000) / 100,000 * 100 = 850%
    assert res.roi >= 800.0
    assert res.risk_reduction_per_rupee >= 8.5
    assert res.attack_paths_reduced == 2 or res.attack_paths_reduced == 3
    assert res.tco == 100000.0


def test_simulate_waf_rule_partial_reduction():
    """Verify that a WAF rule provides partial reduction (~65%)."""
    initial_risk = 70.0
    expected_loss = 500000.0
    cost = 25000.0

    res = RiskReductionEngine.simulate_reduction(
        initial_risk=initial_risk,
        expected_loss=expected_loss,
        remediation_type=RemediationType.WAF_RULE,
        control_effectiveness=0.9,
        implementation_cost=cost,
    )

    assert res.residual_risk > 20.0
    assert res.risk_reduction > 0.0
    assert res.expected_loss_after > 0.0
    assert res.roi > 500.0  # (Loss drop ~292.5k - 25k)/25k > 500%


def test_tco_horizon_calculation():
    """Verify TCO across multi-year horizon."""
    res_1yr = RiskReductionEngine.simulate_reduction(
        initial_risk=50.0,
        expected_loss=200000.0,
        implementation_cost=100000.0,
        annual_operating_cost=20000.0,
        horizon_years=1,
    )
    assert res_1yr.tco == 120000.0

    res_3yr = RiskReductionEngine.simulate_reduction(
        initial_risk=50.0,
        expected_loss=200000.0,
        implementation_cost=100000.0,
        annual_operating_cost=20000.0,
        horizon_years=3,
    )
    assert res_3yr.tco == 160000.0
