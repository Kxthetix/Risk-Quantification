"""Unit tests for Cybersecurity Investment Optimizer (0/1 Knapsack & Strategies) (Phase 8)."""
import pytest

from app.engines.investment_optimizer import (
    CandidateAction,
    InvestmentOptimizer,
    OptimizationAlgorithm,
)
from app.models.enums import RemediationType


@pytest.fixture
def sample_candidates():
    """Create test portfolio of remediations and controls with varying costs and values."""
    return [
        CandidateAction(
            action_id="patch-apache",
            title="Patch Apache Log4j",
            action_type="REMEDIATION",
            remediation_type=RemediationType.PATCH,
            cost=50000.0,
            expected_loss_reduction=2000000.0,
            risk_reduction=40.0,
            priority_score=95.0,
            asset_id="web-server-1",
        ),
        CandidateAction(
            action_id="deploy-waf",
            title="Deploy Cloudflare WAF",
            action_type="CONTROL",
            cost=300000.0,
            expected_loss_reduction=4000000.0,
            risk_reduction=60.0,
            priority_score=90.0,
        ),
        CandidateAction(
            action_id="upgrade-db",
            title="Upgrade PostgreSQL Database",
            action_type="REMEDIATION",
            remediation_type=RemediationType.UPGRADE,
            cost=200000.0,
            expected_loss_reduction=1500000.0,
            risk_reduction=30.0,
            priority_score=75.0,
            asset_id="db-server-1",
        ),
        CandidateAction(
            action_id="mfa-vpn",
            title="Enforce Hardware MFA on VPN",
            action_type="CONTROL",
            cost=150000.0,
            expected_loss_reduction=2500000.0,
            risk_reduction=50.0,
            priority_score=85.0,
        ),
        CandidateAction(
            action_id="segment-dmz",
            title="Microsegment DMZ Subnet",
            action_type="CONTROL",
            cost=600000.0,
            expected_loss_reduction=3000000.0,
            risk_reduction=35.0,
            priority_score=70.0,
            depends_on_id="deploy-waf",  # Dependency test
        ),
    ]


def test_knapsack_optimization_budget_fit(sample_candidates):
    """Verify 0/1 knapsack optimal selection within a ₹500,000 budget."""
    budget = 500000.0
    current_expected_loss = 10000000.0

    output = InvestmentOptimizer.optimize(
        candidates=sample_candidates,
        budget=budget,
        current_expected_loss=current_expected_loss,
        algorithm=OptimizationAlgorithm.KNAPSACK,
    )

    assert output.total_cost <= budget
    assert len(output.selected_actions) >= 2
    # Should pick high ROI items: Log4j (50k) + MFA (150k) + WAF (300k) = exactly 500k
    selected_ids = {a["action_id"] for a in output.selected_actions}
    assert "patch-apache" in selected_ids
    assert output.expected_loss_reduction >= 6000000.0
    assert output.roi > 1000.0


def test_greedy_optimization(sample_candidates):
    """Verify greedy value density heuristic produces a valid portfolio."""
    budget = 400000.0
    current_expected_loss = 8000000.0

    output = InvestmentOptimizer.optimize(
        candidates=sample_candidates,
        budget=budget,
        current_expected_loss=current_expected_loss,
        algorithm=OptimizationAlgorithm.GREEDY,
    )

    assert output.total_cost <= budget
    assert len(output.selected_actions) >= 1


def test_dependency_enforcement(sample_candidates):
    """Verify an action depending on a prerequisite cannot be chosen without the prerequisite."""
    # Give budget enough only for segment-dmz (600k) but NOT WAF (300k) + segment-dmz (600k) = 900k
    budget = 650000.0
    current_expected_loss = 10000000.0

    output = InvestmentOptimizer.optimize(
        candidates=sample_candidates,
        budget=budget,
        current_expected_loss=current_expected_loss,
        algorithm=OptimizationAlgorithm.GREEDY,
    )

    selected_ids = {a["action_id"] for a in output.selected_actions}
    if "segment-dmz" in selected_ids:
        assert "deploy-waf" in selected_ids


def test_strategic_alternatives(sample_candidates):
    """Verify 4 alternative strategic portfolios are generated."""
    budget = 600000.0
    current_expected_loss = 10000000.0

    alts = InvestmentOptimizer.generate_alternatives(sample_candidates, budget, current_expected_loss)

    assert len(alts) == 4
    keys = {a.strategy_key for a in alts}
    assert keys == {"LOWEST_COST", "MAX_RISK_REDUCTION", "MAX_ROI", "BALANCED"}
    for a in alts:
        assert a.total_cost <= budget + 1.0


def test_budget_curve_and_diminishing_returns(sample_candidates):
    """Verify budget curve generation and inflection point calculation."""
    current_expected_loss = 10000000.0
    points, inflection = InvestmentOptimizer.generate_budget_curve(
        candidates=sample_candidates,
        current_expected_loss=current_expected_loss,
        max_budget=1000000.0,
        steps=5,
    )

    assert len(points) == 5
    assert points[-1].budget == 1000000.0
    # Expected loss reduction should be monotonically non-decreasing
    for i in range(len(points) - 1):
        assert points[i+1].expected_loss_reduction >= points[i].expected_loss_reduction
