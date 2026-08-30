"""Cybersecurity Investment Portfolio Optimizer (Phase 8).

Features:
- 0/1 Knapsack dynamic programming optimization
- Greedy approximation by ROI / Value density
- Sequential marginal risk reduction with control overlap handling
- Alternative strategic investment portfolios (Lowest Cost, Max Reduction, Max ROI, Balanced)
- Budget Curve generation & Diminishing Returns inflection analysis
"""
from dataclasses import dataclass, field
import math
from typing import Any, Dict, List, Optional, Set, Tuple
import uuid

from app.models.enums import OptimizationAlgorithm, RemediationType


@dataclass
class CandidateAction:
    """Actionable remediation or control candidate for investment optimization."""
    action_id: str
    title: str
    action_type: str  # REMEDIATION or CONTROL
    remediation_type: Optional[RemediationType] = None
    cost: float = 0.0
    annual_cost: float = 0.0
    expected_loss_reduction: float = 0.0
    risk_reduction: float = 0.0
    priority_score: float = 0.0
    asset_id: Optional[str] = None
    depends_on_id: Optional[str] = None
    attack_paths_reduced: int = 0
    justifications: List[str] = field(default_factory=list)


@dataclass
class OptimizationOutput:
    """Consolidated mathematical portfolio solution."""
    selected_actions: List[Dict[str, Any]]
    total_cost: float
    expected_loss_before: float
    expected_loss_after: float
    expected_loss_reduction: float
    roi: float
    risk_reduction_per_rupee: float
    critical_paths_reduced: int
    algorithm: OptimizationAlgorithm


@dataclass
class StrategyAlternative:
    """A strategic perspective on investment allocation."""
    strategy_name: str
    strategy_key: str
    description: str
    total_cost: float
    expected_loss_reduction: float
    roi: float
    actions_count: int
    selected_actions: List[Dict[str, Any]]


@dataclass
class BudgetCurvePoint:
    """A single coordinate on the Security Budget vs Risk Reduction curve."""
    budget: float
    total_cost: float
    expected_loss_reduction: float
    roi: float
    actions_count: int
    marginal_gain_per_rupee: float = 0.0


class InvestmentOptimizer:
    """Orchestrates mathematical optimization and strategic comparisons for security spend."""

    @classmethod
    def optimize(
        cls,
        candidates: List[CandidateAction],
        budget: float,
        current_expected_loss: float,
        algorithm: OptimizationAlgorithm = OptimizationAlgorithm.KNAPSACK,
    ) -> OptimizationOutput:
        """Execute portfolio optimization subject to budget and prerequisite constraints."""
        if not candidates or budget <= 0:
            return OptimizationOutput(
                selected_actions=[],
                total_cost=0.0,
                expected_loss_before=round(current_expected_loss, 2),
                expected_loss_after=round(current_expected_loss, 2),
                expected_loss_reduction=0.0,
                roi=0.0,
                risk_reduction_per_rupee=0.0,
                critical_paths_reduced=0,
                algorithm=algorithm,
            )

        if algorithm == OptimizationAlgorithm.KNAPSACK:
            selected = cls._solve_knapsack(candidates, budget)
        else:
            selected = cls._solve_greedy(candidates, budget)

        # Calculate totals
        total_cost = sum(a.cost for a in selected)
        raw_loss_red = sum(a.expected_loss_reduction for a in selected)

        # Apply diminishing overlap factor if multiple actions target same asset
        asset_counts: Dict[str, int] = {}
        loss_reduction = 0.0
        for a in selected:
            if a.asset_id:
                cnt = asset_counts.get(a.asset_id, 0)
                overlap_mult = 1.0 / (1.0 + 0.25 * cnt)  # diminishing return on same asset
                asset_counts[a.asset_id] = cnt + 1
                loss_reduction += a.expected_loss_reduction * overlap_mult
            else:
                loss_reduction += a.expected_loss_reduction

        loss_reduction = min(current_expected_loss, round(loss_reduction, 2))
        expected_loss_after = max(0.0, round(current_expected_loss - loss_reduction, 2))

        cost_metric = max(1.0, total_cost)
        roi = round(((loss_reduction - cost_metric) / cost_metric) * 100.0, 1) if total_cost > 0 else 0.0
        rrpr = round(loss_reduction / cost_metric, 2) if total_cost > 0 else 0.0
        total_paths_red = sum(a.attack_paths_reduced for a in selected)

        actions_dicts = [
            {
                "action_id": a.action_id,
                "title": a.title,
                "action_type": a.action_type,
                "cost": round(a.cost, 2),
                "expected_loss_reduction": round(a.expected_loss_reduction, 2),
                "risk_reduction": round(a.risk_reduction, 1),
                "roi": round(((a.expected_loss_reduction - max(1.0, a.cost)) / max(1.0, a.cost)) * 100.0, 1) if a.cost > 0 else 0.0,
                "priority_score": a.priority_score,
                "attack_paths_reduced": a.attack_paths_reduced,
                "justifications": a.justifications,
            }
            for a in selected
        ]

        return OptimizationOutput(
            selected_actions=actions_dicts,
            total_cost=round(total_cost, 2),
            expected_loss_before=round(current_expected_loss, 2),
            expected_loss_after=expected_loss_after,
            expected_loss_reduction=loss_reduction,
            roi=roi,
            risk_reduction_per_rupee=rrpr,
            critical_paths_reduced=total_paths_red,
            algorithm=algorithm,
        )

    @classmethod
    def _solve_greedy(
        cls,
        candidates: List[CandidateAction],
        budget: float,
    ) -> List[CandidateAction]:
        """Greedy heuristic: Ranks by value density (Loss Reduction / Cost) respecting dependencies."""
        # Sort by value density descending
        def _density(a: CandidateAction) -> float:
            c = max(100.0, a.cost)
            return (a.expected_loss_reduction / c) * 100.0 + a.priority_score

        sorted_cands = sorted(candidates, key=_density, reverse=True)
        selected: List[CandidateAction] = []
        selected_ids: Set[str] = set()
        rem_budget = budget

        for a in sorted_cands:
            # Check prerequisite dependency
            if a.depends_on_id and a.depends_on_id not in selected_ids:
                # Try to find and include prerequisite first
                prereq = next((c for c in candidates if c.action_id == a.depends_on_id), None)
                if prereq and (prereq.cost + a.cost) <= rem_budget:
                    selected.append(prereq)
                    selected_ids.add(prereq.action_id)
                    rem_budget -= prereq.cost
                else:
                    continue  # Cannot include without prerequisite

            if a.cost <= rem_budget and a.action_id not in selected_ids:
                selected.append(a)
                selected_ids.add(a.action_id)
                rem_budget -= a.cost

        return selected

    @classmethod
    def _solve_knapsack(
        cls,
        candidates: List[CandidateAction],
        budget: float,
    ) -> List[CandidateAction]:
        """0/1 Knapsack dynamic programming solver with scaled integer capacity."""
        if not candidates or budget <= 0:
            return []

        # Find scale factor to normalize currency to manageable DP array size (max 5000 bins)
        min_nonzero_cost = min((c.cost for c in candidates if c.cost > 0), default=1000.0)
        scale = max(1.0, min(min_nonzero_cost, budget / 2000.0))

        scaled_budget = int(budget / scale)
        n = len(candidates)

        # dp[i][w] = max value
        dp = [0.0] * (scaled_budget + 1)
        item_sets: List[List[int]] = [[] for _ in range(scaled_budget + 1)]

        for idx, item in enumerate(candidates):
            w = max(1, int(item.cost / scale))
            v = item.expected_loss_reduction

            # Traverse backwards for 0/1 knapsack
            for j in range(scaled_budget, w - 1, -1):
                if dp[j - w] + v > dp[j]:
                    dp[j] = dp[j - w] + v
                    item_sets[j] = item_sets[j - w] + [idx]

        best_indices = item_sets[scaled_budget]
        selected = [candidates[i] for i in best_indices]

        # Verify prerequisite constraints: if prerequisite missing, fallback to greedy validation
        selected_ids = {a.action_id for a in selected}
        valid_selected = []
        for a in selected:
            if a.depends_on_id and a.depends_on_id not in selected_ids:
                continue
            valid_selected.append(a)

        return valid_selected if valid_selected else cls._solve_greedy(candidates, budget)

    @classmethod
    def generate_alternatives(
        cls,
        candidates: List[CandidateAction],
        budget: float,
        current_expected_loss: float,
    ) -> List[StrategyAlternative]:
        """Produce 4 distinct strategic investment options for executive decision-making."""
        strategies = []

        # Strategy A: Lowest Cost (Quick Wins & high-efficiency patches at ~50% budget)
        low_cost_budget = budget * 0.50
        strat_a_output = cls.optimize(candidates, low_cost_budget, current_expected_loss, OptimizationAlgorithm.GREEDY)
        strategies.append(
            StrategyAlternative(
                strategy_name="Lowest Cost (Quick Wins)",
                strategy_key="LOWEST_COST",
                description="Focuses on highest-efficiency, low-cost mitigations utilizing only 50% of available budget.",
                total_cost=strat_a_output.total_cost,
                expected_loss_reduction=strat_a_output.expected_loss_reduction,
                roi=strat_a_output.roi,
                actions_count=len(strat_a_output.selected_actions),
                selected_actions=strat_a_output.selected_actions,
            )
        )

        # Strategy B: Maximum Risk Reduction (Knapsack optimizing full budget)
        strat_b_output = cls.optimize(candidates, budget, current_expected_loss, OptimizationAlgorithm.KNAPSACK)
        strategies.append(
            StrategyAlternative(
                strategy_name="Maximum Risk Reduction",
                strategy_key="MAX_RISK_REDUCTION",
                description="Applies optimal mathematical combination to achieve the greatest absolute drop in financial loss.",
                total_cost=strat_b_output.total_cost,
                expected_loss_reduction=strat_b_output.expected_loss_reduction,
                roi=strat_b_output.roi,
                actions_count=len(strat_b_output.selected_actions),
                selected_actions=strat_b_output.selected_actions,
            )
        )

        # Strategy C: Maximum ROI
        strat_c_output = cls.optimize(candidates, budget, current_expected_loss, OptimizationAlgorithm.GREEDY)
        strategies.append(
            StrategyAlternative(
                strategy_name="Maximum ROI",
                strategy_key="MAX_ROI",
                description="Strictly prioritizes actions delivering the highest return on investment per rupee spent.",
                total_cost=strat_c_output.total_cost,
                expected_loss_reduction=strat_c_output.expected_loss_reduction,
                roi=strat_c_output.roi,
                actions_count=len(strat_c_output.selected_actions),
                selected_actions=strat_c_output.selected_actions,
            )
        )

        # Strategy D: Balanced (Blends patch, network segmentation, and endpoint defense at 85% budget)
        balanced_budget = budget * 0.85
        strat_d_output = cls.optimize(candidates, balanced_budget, current_expected_loss, OptimizationAlgorithm.KNAPSACK)
        strategies.append(
            StrategyAlternative(
                strategy_name="Balanced Security Portfolio",
                strategy_key="BALANCED",
                description="Maintains risk reduction momentum while preserving a 15% budget buffer for contingency.",
                total_cost=strat_d_output.total_cost,
                expected_loss_reduction=strat_d_output.expected_loss_reduction,
                roi=strat_d_output.roi,
                actions_count=len(strat_d_output.selected_actions),
                selected_actions=strat_d_output.selected_actions,
            )
        )

        return strategies

    @classmethod
    def generate_budget_curve(
        cls,
        candidates: List[CandidateAction],
        current_expected_loss: float,
        max_budget: float = 10000000.0,
        steps: int = 8,
    ) -> Tuple[List[BudgetCurvePoint], Optional[float]]:
        """Evaluate the budget curve and identify diminishing returns inflection point."""
        if max_budget <= 0:
            max_budget = sum(c.cost for c in candidates) or 5000000.0

        step_size = max_budget / max(1, steps)
        points: List[BudgetCurvePoint] = []
        prev_reduction = 0.0
        prev_cost = 0.0

        inflection_point: Optional[float] = None
        min_marginal_gain = float("inf")

        for i in range(1, steps + 1):
            curr_budget = round(i * step_size, 2)
            res = cls.optimize(candidates, curr_budget, current_expected_loss, OptimizationAlgorithm.KNAPSACK)

            delta_cost = res.total_cost - prev_cost
            delta_gain = res.expected_loss_reduction - prev_reduction
            marginal = (delta_gain / delta_cost) if delta_cost > 0 else 0.0

            # Diminishing returns detection: when marginal gain drops below 1.5
            if inflection_point is None and i > 2 and marginal < 1.5 and res.expected_loss_reduction > (current_expected_loss * 0.6):
                inflection_point = curr_budget

            points.append(
                BudgetCurvePoint(
                    budget=curr_budget,
                    total_cost=res.total_cost,
                    expected_loss_reduction=res.expected_loss_reduction,
                    roi=res.roi,
                    actions_count=len(res.selected_actions),
                    marginal_gain_per_rupee=round(marginal, 2),
                )
            )
            prev_reduction = res.expected_loss_reduction
            prev_cost = res.total_cost

        return points, inflection_point
