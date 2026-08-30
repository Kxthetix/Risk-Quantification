"""Unit tests for Remediation Priority Engine (Phase 8)."""
import pytest

from app.engines.remediation_priority_engine import (
    FindingContext,
    RemediationPriorityEngine,
    RemediationWeightConfig,
)
from app.models.enums import (
    AssetCriticality,
    ExploitAvailability,
    RemediationPriorityLevel,
)


def test_priority_engine_critical_finding():
    """Verify that a high-risk, weaponized, chokepoint finding receives CRITICAL priority."""
    ctx = FindingContext(
        risk_score=92.0,
        expected_loss=5000000.0,
        p90_loss=12000000.0,
        max_portfolio_loss=10000000.0,
        attack_path_count=4,
        max_attack_path_score=88.0,
        is_chokepoint=True,
        chokepoint_reduction_potential=0.85,
        criticality=AssetCriticality.CRITICAL,
        exploit_available=ExploitAvailability.YES,
        known_exploited=True,
        validation_confidence=1.0,
        is_internet_exposed=True,
        estimated_cost=200000.0,
    )

    res = RemediationPriorityEngine.calculate_priority(ctx)

    assert res.priority_score >= 80.0
    assert res.priority_level == RemediationPriorityLevel.CRITICAL
    assert len(res.justifications) >= 4
    assert any("CRITICAL" in j for j in res.justifications)
    assert any("CISA KEV" in j for j in res.justifications)
    assert any("attack paths" in j for j in res.justifications)


def test_priority_engine_low_finding():
    """Verify that a low-risk internal finding receives LOW priority."""
    ctx = FindingContext(
        risk_score=20.0,
        expected_loss=50000.0,
        p90_loss=100000.0,
        max_portfolio_loss=10000000.0,
        attack_path_count=0,
        max_attack_path_score=0.0,
        is_chokepoint=False,
        chokepoint_reduction_potential=0.0,
        criticality=AssetCriticality.LOW,
        exploit_available=ExploitAvailability.NO,
        known_exploited=False,
        validation_confidence=0.5,
        is_internet_exposed=False,
        estimated_cost=50000.0,
    )

    res = RemediationPriorityEngine.calculate_priority(ctx)

    assert res.priority_score < 40.0
    assert res.priority_level == RemediationPriorityLevel.LOW
    assert res.factor_breakdown["known_exploitation"] == 0.0
    assert res.factor_breakdown["asset_criticality"] == 25.0


def test_priority_engine_custom_weights():
    """Verify customizable weight configuration overrides."""
    ctx = FindingContext(
        risk_score=50.0,
        expected_loss=200000.0,
        criticality=AssetCriticality.MEDIUM,
        known_exploited=True,
    )

    # Heavily weight known exploitation
    config = RemediationWeightConfig(
        risk_weight=0.1,
        financial_weight=0.1,
        attack_path_weight=0.1,
        criticality_weight=0.1,
        exploitability_weight=0.1,
        known_exploited_weight=0.5,
        validation_weight=0.0,
    )

    res = RemediationPriorityEngine.calculate_priority(ctx, config=config)
    assert res.priority_score >= 60.0
