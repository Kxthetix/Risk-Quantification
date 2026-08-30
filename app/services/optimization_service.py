"""Investment Optimization Service orchestrating portfolio algorithms and executive outputs (Phase 8)."""
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.engines.investment_optimizer import (
    CandidateAction,
    InvestmentOptimizer,
    OptimizationOutput,
)
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.attack_path import AttackPath
from app.models.control import Control
from app.models.enums import AuditAction, OptimizationAlgorithm, RemediationStatus
from app.models.financial_assessment import FinancialAssessment
from app.models.investment_scenario import InvestmentScenario
from app.models.optimization_result import OptimizationResult
from app.models.remediation import Remediation
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.schemas.optimization import (
    AlternativesResponse,
    BudgetCurvePointResponse,
    BudgetCurveResponse,
    ExecutiveInvestmentOutputResponse,
    StrategyAlternativeItem,
    WhatIfOptimizationResponse,
)
from app.services.audit_service import audit_service
from app.services.control_service import control_service


class OptimizationService:
    """Manages cybersecurity investment portfolio optimization and executive insights."""

    async def run_optimization(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        budget: float,
        algorithm: OptimizationAlgorithm = OptimizationAlgorithm.KNAPSACK,
        scenario_id: Optional[uuid.UUID] = None,
        horizon_years: int = 1,
        current_user: Optional[User] = None,
    ) -> OptimizationResult:
        """Run mathematical portfolio optimization and persist audit snapshot."""
        # 1. Collect candidates and snapshots
        candidates = await self._gather_candidate_actions(db, organization_id, horizon_years)
        curr_loss = await self._calculate_current_expected_loss(db, organization_id)
        risk_snap = await self._capture_risk_snapshot(db, organization_id)
        fin_snap = await self._capture_financial_snapshot(db, organization_id)

        # 2. Run Optimizer
        output: OptimizationOutput = InvestmentOptimizer.optimize(
            candidates=candidates,
            budget=budget,
            current_expected_loss=curr_loss,
            algorithm=algorithm,
        )

        # 3. Create OptimizationResult row
        opt_row = OptimizationResult(
            organization_id=organization_id,
            scenario_id=scenario_id,
            algorithm=algorithm,
            budget=budget,
            total_cost=output.total_cost,
            expected_loss_before=output.expected_loss_before,
            expected_loss_after=output.expected_loss_after,
            expected_loss_reduction=output.expected_loss_reduction,
            roi=output.roi,
            risk_reduction_per_rupee=output.risk_reduction_per_rupee,
            critical_paths_reduced=output.critical_paths_reduced,
            selected_actions=output.selected_actions,
            input_snapshot={"candidate_count": len(candidates), "budget": budget, "horizon_years": horizon_years},
            risk_snapshot=risk_snap,
            financial_snapshot=fin_snap,
            optimization_model_version="1.0",
            risk_model_version="1.0",
            financial_model_version="1.0",
        )
        db.add(opt_row)

        if current_user:
            await audit_service.log(
                db=db,
                user=current_user,
                action=AuditAction.OPTIMIZATION_RUN,
                resource_type="optimization_result",
                resource_id=str(opt_row.id),
                metadata={
                    "budget": budget,
                    "total_cost": output.total_cost,
                    "expected_loss_reduction": output.expected_loss_reduction,
                    "roi": output.roi,
                },
            )

        await db.commit()
        await db.refresh(opt_row)
        return opt_row

    async def get_optimization_result(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        result_id: uuid.UUID,
    ) -> OptimizationResult:
        """Fetch a specific optimization result ensuring multi-tenant isolation."""
        stmt = select(OptimizationResult).where(
            OptimizationResult.id == result_id,
            OptimizationResult.organization_id == organization_id,
        )
        res = await db.execute(stmt)
        result = res.scalar_one_or_none()
        if not result:
            raise NotFoundError(
                message=f"Optimization result {result_id} not found.",
                error_code="OPTIMIZATION_NOT_FOUND",
            )
        return result

    async def run_what_if(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_ids: Optional[List[uuid.UUID]] = None,
        control_ids: Optional[List[uuid.UUID]] = None,
        horizon_years: int = 1,
    ) -> WhatIfOptimizationResponse:
        """Simulate ad-hoc user selection of candidate mitigations."""
        candidates = await self._gather_candidate_actions(db, organization_id, horizon_years)
        curr_loss = await self._calculate_current_expected_loss(db, organization_id)

        target_ids = set(str(rid) for rid in (remediation_ids or [])) | set(str(cid) for cid in (control_ids or []))
        selected = [c for c in candidates if c.action_id in target_ids]

        total_cost = sum(c.cost for c in selected)
        loss_reduction = min(curr_loss, sum(c.expected_loss_reduction for c in selected))
        proj_loss = max(0.0, curr_loss - loss_reduction)

        cost_metric = max(1.0, total_cost)
        roi = round(((loss_reduction - cost_metric) / cost_metric) * 100.0, 1) if total_cost > 0 else 0.0
        rrpr = round(loss_reduction / cost_metric, 2) if total_cost > 0 else 0.0

        return WhatIfOptimizationResponse(
            current_expected_loss=round(curr_loss, 2),
            projected_expected_loss=round(proj_loss, 2),
            risk_reduction=round(loss_reduction, 2),
            investment=round(total_cost, 2),
            roi=roi,
            risk_reduction_per_rupee=rrpr,
            selected_actions=[
                {
                    "action_id": c.action_id,
                    "title": c.title,
                    "cost": c.cost,
                    "expected_loss_reduction": c.expected_loss_reduction,
                    "roi": round(((c.expected_loss_reduction - max(1.0, c.cost)) / max(1.0, c.cost)) * 100.0, 1) if c.cost > 0 else 0.0,
                }
                for c in selected
            ],
        )

    async def get_alternatives(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        budget: float,
    ) -> AlternativesResponse:
        """Produce 4 strategic comparison options (Lowest Cost, Max Reduction, Max ROI, Balanced)."""
        candidates = await self._gather_candidate_actions(db, organization_id, horizon_years=1)
        curr_loss = await self._calculate_current_expected_loss(db, organization_id)
        alts = InvestmentOptimizer.generate_alternatives(candidates, budget, curr_loss)

        return AlternativesResponse(
            budget=budget,
            alternatives=[
                StrategyAlternativeItem(
                    strategy_name=a.strategy_name,
                    strategy_key=a.strategy_key,
                    description=a.description,
                    total_cost=a.total_cost,
                    expected_loss_reduction=a.expected_loss_reduction,
                    roi=a.roi,
                    actions_count=a.actions_count,
                    selected_actions=a.selected_actions,
                )
                for a in alts
            ],
        )

    async def get_budget_curve(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        max_budget: float = 10000000.0,
        steps: int = 8,
    ) -> BudgetCurveResponse:
        """Compute Security Budget vs Risk Reduction curve with diminishing returns inflection point."""
        candidates = await self._gather_candidate_actions(db, organization_id, horizon_years=1)
        curr_loss = await self._calculate_current_expected_loss(db, organization_id)
        points, inflection = InvestmentOptimizer.generate_budget_curve(candidates, curr_loss, max_budget, steps)

        return BudgetCurveResponse(
            points=[
                BudgetCurvePointResponse(
                    budget=p.budget,
                    total_cost=p.total_cost,
                    expected_loss_reduction=p.expected_loss_reduction,
                    roi=p.roi,
                    actions_count=p.actions_count,
                    marginal_gain_per_rupee=p.marginal_gain_per_rupee,
                )
                for p in points
            ],
            diminishing_returns_inflection_budget=inflection,
        )

    async def get_executive_summary(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> ExecutiveInvestmentOutputResponse:
        """Synthesize board-ready executive security investment metrics."""
        candidates = await self._gather_candidate_actions(db, organization_id, horizon_years=1)
        curr_loss = await self._calculate_current_expected_loss(db, organization_id)

        # Baseline budget: 25% of current annual expected loss or default 50L
        budget = max(500000.0, curr_loss * 0.30)
        output = InvestmentOptimizer.optimize(candidates, budget, curr_loss, OptimizationAlgorithm.KNAPSACK)

        red_pct = (output.expected_loss_reduction / max(1.0, curr_loss)) * 100.0 if curr_loss > 0 else 0.0
        top_action = output.selected_actions[0]["title"] if output.selected_actions else "Maintain current posture"
        priority = "CRITICAL" if red_pct >= 50.0 else "HIGH"

        return ExecutiveInvestmentOutputResponse(
            security_investment=output.total_cost,
            expected_annual_risk_reduction=output.expected_loss_reduction,
            current_expected_loss=round(curr_loss, 2),
            residual_risk_loss=output.expected_loss_after,
            risk_reduction_percent=round(red_pct, 1),
            estimated_roi=output.roi,
            critical_attack_paths_reduced=output.critical_paths_reduced,
            top_recommended_action=top_action,
            action_priority=priority,
        )

    async def _gather_candidate_actions(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        horizon_years: int = 1,
    ) -> List[CandidateAction]:
        """Aggregate open remediations and active defensive controls as candidate actions."""
        candidates: List[CandidateAction] = []

        # 1. Fetch open/planned remediations
        rem_stmt = (
            select(Remediation)
            .options(selectinload(Remediation.remediation_cost))
            .where(
                Remediation.organization_id == organization_id,
                Remediation.status.in_([RemediationStatus.OPEN, RemediationStatus.PLANNED]),
            )
        )
        rem_res = await db.execute(rem_stmt)
        remediations = list(rem_res.scalars().all())

        for r in remediations:
            cost = r.estimated_cost
            ann_cost = 0.0
            if r.remediation_cost:
                cost = r.remediation_cost.most_likely_cost
                ann_cost = r.remediation_cost.recurring_cost

            tco = cost + (ann_cost * horizon_years)
            candidates.append(
                CandidateAction(
                    action_id=str(r.id),
                    title=r.title,
                    action_type="REMEDIATION",
                    remediation_type=r.remediation_type,
                    cost=tco,
                    annual_cost=ann_cost,
                    expected_loss_reduction=r.expected_loss_reduction,
                    risk_reduction=r.risk_reduction,
                    priority_score=r.priority_score,
                    depends_on_id=str(r.depends_on_remediation_id) if r.depends_on_remediation_id else None,
                    attack_paths_reduced=1,
                    justifications=[f"Priority Score: {r.priority_score:.1f}", f"Type: {r.remediation_type.value}"],
                )
            )

        # 2. Fetch active defensive controls
        controls = await control_service.get_controls(db, organization_id, enabled=True)
        for c in controls:
            tco = c.implementation_cost + (c.annual_cost * horizon_years)
            # Estimate enterprise-wide loss reduction from control effectiveness
            est_red = tco * (c.effectiveness * 2.8)
            candidates.append(
                CandidateAction(
                    action_id=str(c.id),
                    title=c.name,
                    action_type="CONTROL",
                    cost=tco,
                    annual_cost=c.annual_cost,
                    expected_loss_reduction=est_red,
                    risk_reduction=c.effectiveness * 35.0,
                    priority_score=c.effectiveness * 85.0,
                    attack_paths_reduced=2,
                    justifications=[f"Defensive Control: {c.control_type.value}", f"Effectiveness: {c.effectiveness*100:.0f}%"],
                )
            )

        return candidates

    async def _calculate_current_expected_loss(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> float:
        """Compute organization-wide baseline expected annual financial loss."""
        stmt = select(FinancialAssessment).where(FinancialAssessment.organization_id == organization_id)
        res = await db.execute(stmt)
        assessments = list(res.scalars().all())
        if assessments:
            return sum(float(fa.expected_loss) for fa in assessments)

        # Fallback: sum asset business values weighted by risk
        asset_stmt = select(Asset).where(Asset.organization_id == organization_id)
        asset_res = await db.execute(asset_stmt)
        assets = list(asset_res.scalars().all())
        if assets:
            return sum(float(getattr(a, "business_value", 500000.0) or 500000.0) * 0.15 for a in assets)

        return 5000000.0

    async def _capture_risk_snapshot(self, db: AsyncSession, organization_id: uuid.UUID) -> Dict[str, Any]:
        """Capture audit snapshot of current risk scores."""
        stmt = (
            select(RiskAssessment)
            .join(AssetVulnerability, RiskAssessment.asset_vulnerability_id == AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(Asset.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        risks = list(res.scalars().all())
        avg_score = (sum(getattr(r, "final_risk_score", getattr(r, "risk_score", 0.0)) for r in risks) / len(risks)) if risks else 0.0
        return {"assessed_findings_count": len(risks), "average_risk_score": round(avg_score, 1)}

    async def _capture_financial_snapshot(self, db: AsyncSession, organization_id: uuid.UUID) -> Dict[str, Any]:
        """Capture audit snapshot of financial distributions."""
        stmt = select(FinancialAssessment).where(FinancialAssessment.organization_id == organization_id)
        res = await db.execute(stmt)
        fas = list(res.scalars().all())
        total_exp = sum(fa.expected_loss for fa in fas)
        total_p90 = sum(fa.p90_loss for fa in fas)
        return {"assessments_count": len(fas), "total_expected_loss": round(total_exp, 2), "total_p90_loss": round(total_p90, 2)}


optimization_service = OptimizationService()
