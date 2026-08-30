"""Financial Assessment and Impact Analysis service (Phase 6)."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, BadRequestError, NotFoundError
from app.engines.annualized_loss_engine import AnnualizedLossEngine
from app.engines.financial_impact_engine import FinancialImpactEngine
from app.engines.monte_carlo_engine import MonteCarloEngine, MonteCarloResult
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.business_service import BusinessService
from app.models.enums import AuditAction, FinancialScenarioType
from app.models.financial_assessment import FinancialAssessment
from app.models.financial_distribution import FinancialDistribution
from app.models.financial_factor import FinancialAssumption, FinancialFactor
from app.models.financial_profile import FinancialProfile
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.models.vulnerability import Vulnerability
from app.schemas.financial import (
    ControlScenarioRequest,
    ControlScenarioResponse,
    FinancialScenarioResponse,
    WhatIfRequest,
    WhatIfResponse,
)
from app.services.audit_service import audit_service
from app.services.financial_profile_service import financial_profile_service


class FinancialService:
    """Orchestrates probabilistic cyber financial risk quantification and decision support."""

    async def calculate_financial_impact(
        self,
        db: AsyncSession,
        asset_vulnerability_id: uuid.UUID,
        current_user: User,
        simulation_count: int = 10000,
        random_seed: int = 42,
        overrides: Optional[Dict[str, Any]] = None,
    ) -> FinancialAssessment:
        """Run complete Monte Carlo simulation and persist financial impact assessment."""
        # 1. Fetch AssetVulnerability with related models
        stmt = (
            select(AssetVulnerability)
            .options(
                selectinload(AssetVulnerability.asset).selectinload(Asset.business_service),
                selectinload(AssetVulnerability.vulnerability),
                selectinload(AssetVulnerability.risk_assessment),
            )
            .where(AssetVulnerability.id == asset_vulnerability_id)
        )
        result = await db.execute(stmt)
        av = result.scalar_one_or_none()

        if not av:
            raise NotFoundError(
                message=f"Asset vulnerability finding {asset_vulnerability_id} not found.",
                error_code="ASSET_VULN_NOT_FOUND",
            )

        asset: Asset = av.asset
        if not asset:
            raise NotFoundError(
                message="Associated asset not found.",
                error_code="ASSET_NOT_FOUND",
            )

        # Multi-tenant boundary check
        if asset.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="Access forbidden to cross-organization asset financial data.",
                error_code="TENANT_ISOLATION_VIOLATION",
            )

        # 2. Fetch or initialize FinancialProfile
        profile: FinancialProfile = await financial_profile_service.get_or_create_profile(
            db=db,
            organization_id=asset.organization_id,
        )

        vuln: Optional[Vulnerability] = av.vulnerability
        risk_assessment: Optional[RiskAssessment] = av.risk_assessment
        business_service: Optional[BusinessService] = asset.business_service

        # 3. Generate Factor Distributions
        factor_set = FinancialImpactEngine.generate_factors(
            financial_profile=profile,
            asset=asset,
            vulnerability=vuln,
            risk_assessment=risk_assessment,
            business_service=business_service,
            overrides=overrides,
        )

        # 4. Execute Monte Carlo Simulation
        mc_result: MonteCarloResult = MonteCarloEngine.run(
            factors=factor_set.factors,
            simulation_count=simulation_count,
            random_seed=random_seed,
        )

        # 5. Calculate Annual Loss Expectancy (ALE)
        ale_result = AnnualizedLossEngine.evaluate(
            expected_single_loss=mc_result.expected_loss,
            risk_assessment=risk_assessment,
            custom_annual_prob=overrides.get("incident_probability") if overrides else None,
        )

        # 6. Check if an existing FinancialAssessment exists for this AssetVulnerability
        existing_stmt = select(FinancialAssessment).where(
            FinancialAssessment.asset_vulnerability_id == av.id
        )
        existing_res = await db.execute(existing_stmt)
        assessment = existing_res.scalar_one_or_none()

        cat_means = mc_result.category_means
        if not assessment:
            assessment = FinancialAssessment(
                organization_id=asset.organization_id,
                asset_id=asset.id,
                asset_vulnerability_id=av.id,
                risk_assessment_id=risk_assessment.id if risk_assessment else None,
                currency=profile.currency,
                simulation_count=mc_result.simulation_count,
                random_seed=mc_result.random_seed,
                expected_loss=mc_result.expected_loss,
            )
            db.add(assessment)

        # Update metrics
        assessment.estimated_loss = mc_result.expected_loss
        assessment.expected_loss = mc_result.expected_loss
        assessment.annual_expected_loss = ale_result.annual_expected_loss
        assessment.minimum_loss = mc_result.minimum_loss
        assessment.maximum_loss = mc_result.maximum_loss

        assessment.p10_loss = mc_result.p10_loss
        assessment.p25_loss = mc_result.p25_loss
        assessment.p50_loss = mc_result.p50_loss
        assessment.p75_loss = mc_result.p75_loss
        assessment.p90_loss = mc_result.p90_loss
        assessment.p95_loss = mc_result.p95_loss

        # Category costs
        assessment.downtime_cost = cat_means.get("DOWNTIME", 0.0)
        assessment.revenue_loss = cat_means.get("REVENUE_LOSS", 0.0)
        assessment.response_cost = cat_means.get("INCIDENT_RESPONSE", 0.0)
        assessment.forensics_cost = cat_means.get("FORENSICS", 0.0)
        assessment.recovery_cost = cat_means.get("RECOVERY", 0.0)
        assessment.productivity_cost = cat_means.get("EMPLOYEE_PRODUCTIVITY", 0.0)
        assessment.data_breach_cost = cat_means.get("DATA_BREACH", 0.0)
        assessment.regulatory_cost = cat_means.get("REGULATORY", 0.0)
        assessment.customer_cost = cat_means.get("CUSTOMER_COMPENSATION", 0.0)
        assessment.third_party_cost = cat_means.get("THIRD_PARTY", 0.0)
        assessment.reputational_cost = cat_means.get("REPUTATIONAL", 0.0)

        assessment.input_snapshot = {
            "asset_id": str(asset.id),
            "criticality": asset.criticality.value if asset.criticality else None,
            "annual_revenue": float(profile.annual_revenue),
            "hourly_revenue": float(profile.hourly_revenue),
            "risk_score": float(risk_assessment.final_risk_score) if risk_assessment else None,
        }
        assessment.configuration_snapshot = {
            "simulation_count": mc_result.simulation_count,
            "random_seed": mc_result.random_seed,
            "model_version": "1.0",
            "annual_probability": ale_result.annual_probability,
        }
        assessment.calculated_at = datetime.now(timezone.utc)

        await db.flush()  # obtain assessment.id safely with all non-null columns populated

        # Clear and repopulate factors, assumptions, and distribution
        await db.flush()

        # Delete previous factors & assumptions if any
        del_factors = select(FinancialFactor).where(FinancialFactor.financial_assessment_id == assessment.id)
        factors_res = await db.execute(del_factors)
        for f in factors_res.scalars().all():
            await db.delete(f)

        del_assump = select(FinancialAssumption).where(FinancialAssumption.financial_assessment_id == assessment.id)
        assump_res = await db.execute(del_assump)
        for a in assump_res.scalars().all():
            await db.delete(a)

        # Create new factor records
        for f_sum in mc_result.factors_summary:
            factor_row = FinancialFactor(
                financial_assessment_id=assessment.id,
                factor_type=f_sum.factor_type,
                distribution_type=f_sum.distribution_type,
                minimum_value=f_sum.minimum_value,
                most_likely_value=f_sum.most_likely_value,
                maximum_value=f_sum.maximum_value,
                probability=f_sum.probability,
                expected_value=f_sum.expected_value,
                contribution=f_sum.contribution_percentage,
            )
            db.add(factor_row)

        # Create assumption records
        for f_def in factor_set.factors:
            for assump in f_def.assumptions:
                assump_row = FinancialAssumption(
                    financial_assessment_id=assessment.id,
                    parameter=assump.get("parameter", "unknown"),
                    value=assump.get("value", ""),
                    unit=assump.get("unit"),
                    source=assump.get("source", "system"),
                    confidence=float(assump.get("confidence", 1.0)),
                    user_provided=bool(assump.get("user_provided", False)),
                )
                db.add(assump_row)

        # Update or create distribution
        dist_stmt = select(FinancialDistribution).where(
            FinancialDistribution.financial_assessment_id == assessment.id
        )
        dist_res = await db.execute(dist_stmt)
        dist_row = dist_res.scalar_one_or_none()

        if not dist_row:
            dist_row = FinancialDistribution(
                financial_assessment_id=assessment.id,
                bins=mc_result.histogram_bins,
                frequencies=mc_result.histogram_frequencies,
            )
            db.add(dist_row)
        else:
            dist_row.bins = mc_result.histogram_bins
            dist_row.frequencies = mc_result.histogram_frequencies

        # Audit logging
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.FINANCIAL_ASSESSMENT_CALCULATED,
            resource_type="financial_assessment",
            resource_id=str(assessment.id),
            metadata={
                "asset_vulnerability_id": str(av.id),
                "expected_loss": mc_result.expected_loss,
                "annual_expected_loss": ale_result.annual_expected_loss,
                "simulations": mc_result.simulation_count,
            },
        )

        await db.commit()
        await db.refresh(assessment)
        return assessment

    async def get_financial_assessment_by_id(
        self,
        db: AsyncSession,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> FinancialAssessment:
        """Fetch financial assessment ensuring tenant isolation."""
        stmt = (
            select(FinancialAssessment)
            .options(
                selectinload(FinancialAssessment.factors),
                selectinload(FinancialAssessment.assumptions),
                selectinload(FinancialAssessment.distribution),
            )
            .where(
                FinancialAssessment.id == assessment_id,
                FinancialAssessment.organization_id == current_user.organization_id,
            )
        )
        result = await db.execute(stmt)
        assessment = result.scalar_one_or_none()

        if not assessment:
            raise NotFoundError(
                message=f"Financial assessment {assessment_id} not found.",
                error_code="FINANCIAL_ASSESSMENT_NOT_FOUND",
            )
        return assessment

    async def get_loss_breakdown(
        self,
        db: AsyncSession,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> Dict[str, Any]:
        """Fetch category breakdown and percentage contributions."""
        assessment = await self.get_financial_assessment_by_id(db, assessment_id, current_user)
        total = assessment.expected_loss if assessment.expected_loss > 0 else 1.0

        contribs = {
            "downtime": round(assessment.downtime_cost / total * 100.0, 2),
            "revenue_loss": round(assessment.revenue_loss / total * 100.0, 2),
            "incident_response": round(assessment.response_cost / total * 100.0, 2),
            "forensics": round(assessment.forensics_cost / total * 100.0, 2),
            "recovery": round(assessment.recovery_cost / total * 100.0, 2),
            "productivity": round(assessment.productivity_cost / total * 100.0, 2),
            "data_breach": round(assessment.data_breach_cost / total * 100.0, 2),
            "regulatory": round(assessment.regulatory_cost / total * 100.0, 2),
            "customer_compensation": round(assessment.customer_cost / total * 100.0, 2),
            "third_party": round(assessment.third_party_cost / total * 100.0, 2),
            "reputational": round(assessment.reputational_cost / total * 100.0, 2),
        }

        return {
            "currency": assessment.currency,
            "expected_loss": assessment.expected_loss,
            "downtime": assessment.downtime_cost,
            "revenue_loss": assessment.revenue_loss,
            "incident_response": assessment.response_cost,
            "forensics": assessment.forensics_cost,
            "recovery": assessment.recovery_cost,
            "productivity": assessment.productivity_cost,
            "data_breach": assessment.data_breach_cost,
            "regulatory": assessment.regulatory_cost,
            "customer_compensation": assessment.customer_cost,
            "third_party": assessment.third_party_cost,
            "reputational": assessment.reputational_cost,
            "percentage_contributions": contribs,
        }

    async def get_distribution(
        self,
        db: AsyncSession,
        assessment_id: uuid.UUID,
        current_user: User,
    ) -> Dict[str, Any]:
        """Fetch pre-computed Monte Carlo distribution histogram."""
        assessment = await self.get_financial_assessment_by_id(db, assessment_id, current_user)
        if not assessment.distribution:
            return {"bins": [], "frequencies": []}
        return {
            "bins": assessment.distribution.bins,
            "frequencies": assessment.distribution.frequencies,
        }

    # ------------------------------------------------------------------
    # Scenarios & Decision Support
    # ------------------------------------------------------------------
    async def calculate_scenario(
        self,
        db: AsyncSession,
        asset_vulnerability_id: uuid.UUID,
        scenario_type: FinancialScenarioType,
        current_user: User,
        simulation_count: int = 10000,
    ) -> FinancialScenarioResponse:
        """Calculate comparative scenario: BEST_CASE, BASE_CASE, or WORST_CASE."""
        overrides = {}
        assumptions = []

        if scenario_type == FinancialScenarioType.BEST_CASE:
            overrides = {
                "downtime": {"minimum": 0.5, "most_likely": 1.0, "maximum": 2.0},
                "data_exposure_probability": 0.0,
                "incident_probability": 0.05,
            }
            assumptions = [
                {"description": "Rapid containment & zero data breach occurrence."},
                {"description": "Minimal downtime of 1 hour."},
            ]
        elif scenario_type == FinancialScenarioType.WORST_CASE:
            overrides = {
                "downtime": {"minimum": 12.0, "most_likely": 36.0, "maximum": 72.0},
                "data_exposure_probability": 1.0,
                "incident_probability": 0.95,
            }
            assumptions = [
                {"description": "Protracted outage of 36+ hours with complete data compromise."},
                {"description": "Severe regulatory fines and customer churn."},
            ]
        else:
            assumptions = [{"description": "Baseline contextual organization assumptions."}]

        assessment = await self.calculate_financial_impact(
            db=db,
            asset_vulnerability_id=asset_vulnerability_id,
            current_user=current_user,
            simulation_count=simulation_count,
            overrides=overrides,
        )

        return FinancialScenarioResponse(
            scenario_type=scenario_type,
            currency=assessment.currency,
            expected_loss=assessment.expected_loss,
            p10=assessment.p10_loss,
            p50=assessment.p50_loss,
            p90=assessment.p90_loss,
            downtime_hours=assessment.downtime_cost,
            revenue_loss=assessment.revenue_loss,
            recovery_cost=assessment.recovery_cost,
            data_breach_cost=assessment.data_breach_cost,
            assumptions=assumptions,
        )

    async def calculate_what_if(
        self,
        db: AsyncSession,
        payload: WhatIfRequest,
        current_user: User,
    ) -> WhatIfResponse:
        """Perform What-If recalculation and return reduction compared to baseline."""
        # 1. Baseline calculation
        baseline = await self.calculate_financial_impact(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
        )

        # 2. Modified calculation
        overrides = {}
        if payload.downtime_hours is not None:
            overrides["downtime"] = {
                "minimum": payload.downtime_hours * 0.5,
                "most_likely": payload.downtime_hours,
                "maximum": payload.downtime_hours * 2.0,
            }
        if payload.incident_probability is not None:
            overrides["incident_probability"] = payload.incident_probability

        new_assessment = await self.calculate_financial_impact(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
            overrides=overrides,
        )

        loss_reduction = max(0.0, baseline.expected_loss - new_assessment.expected_loss)
        pct_reduction = (loss_reduction / baseline.expected_loss * 100.0) if baseline.expected_loss > 0 else 0.0

        return WhatIfResponse(
            currency=baseline.currency,
            baseline_expected_loss=baseline.expected_loss,
            new_expected_loss=new_assessment.expected_loss,
            loss_reduction=round(loss_reduction, 2),
            percentage_reduction=round(pct_reduction, 2),
            parameters_modified=payload.model_dump(exclude_unset=True),
        )

    async def calculate_control_scenario(
        self,
        db: AsyncSession,
        payload: ControlScenarioRequest,
        current_user: User,
    ) -> ControlScenarioResponse:
        """Quantify financial risk reduction and ROI of a proposed security control."""
        baseline = await self.calculate_financial_impact(
            db=db,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            current_user=current_user,
        )

        # Risk reduction value
        risk_red_pct = max(0.0, min(1.0, float(payload.risk_reduction)))
        cost = max(1.0, float(payload.implementation_cost))

        risk_reduction_value = baseline.expected_loss * risk_red_pct
        new_expected_loss = max(0.0, baseline.expected_loss - risk_reduction_value)

        # ROI = ((Reduction - Cost) / Cost) * 100
        roi = ((risk_reduction_value - cost) / cost) * 100.0

        return ControlScenarioResponse(
            control=payload.control,
            currency=baseline.currency,
            implementation_cost=cost,
            baseline_expected_loss=baseline.expected_loss,
            new_expected_loss=round(new_expected_loss, 2),
            risk_reduction_value=round(risk_reduction_value, 2),
            roi=round(roi, 2),
            label="Modeled Estimate",
        )

    # ------------------------------------------------------------------
    # Executive Summaries & Portfolio Dashboards
    # ------------------------------------------------------------------
    async def get_organization_financial_summary(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Dict[str, Any]:
        """Aggregate total financial exposure across all organization assets."""
        org_id = current_user.organization_id
        profile = await financial_profile_service.get_or_create_profile(db, org_id)

        stmt = select(
            func.sum(FinancialAssessment.annual_expected_loss),
            func.sum(FinancialAssessment.expected_loss),
            func.sum(FinancialAssessment.downtime_cost),
            func.sum(FinancialAssessment.recovery_cost),
            func.sum(FinancialAssessment.data_breach_cost),
            func.sum(FinancialAssessment.regulatory_cost),
            func.count(FinancialAssessment.id),
        ).where(FinancialAssessment.organization_id == org_id)

        result = await db.execute(stmt)
        tot_ale, tot_pot, tot_down, tot_rec, tot_data, tot_reg, cnt = result.one()

        # Top 5 losses
        top_losses = await self.get_top_financial_losses(db, current_user, limit=5)

        return {
            "currency": profile.currency,
            "total_expected_annual_loss": round(float(tot_ale or 0.0), 2),
            "total_potential_loss": round(float(tot_pot or 0.0), 2),
            "top_losses": top_losses,
            "expected_downtime_cost": round(float(tot_down or 0.0), 2),
            "expected_recovery_cost": round(float(tot_rec or 0.0), 2),
            "expected_data_impact": round(float(tot_data or 0.0), 2),
            "expected_regulatory_cost": round(float(tot_reg or 0.0), 2),
            "assessed_vulnerabilities_count": int(cnt or 0),
        }

    async def get_top_financial_losses(
        self,
        db: AsyncSession,
        current_user: User,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Retrieve highest financial risk findings ordered by expected loss."""
        stmt = (
            select(FinancialAssessment)
            .options(
                selectinload(FinancialAssessment.asset),
                selectinload(FinancialAssessment.asset_vulnerability).selectinload(AssetVulnerability.vulnerability),
                selectinload(FinancialAssessment.risk_assessment),
            )
            .where(FinancialAssessment.organization_id == current_user.organization_id)
            .order_by(desc(FinancialAssessment.expected_loss))
            .limit(limit)
        )
        result = await db.execute(stmt)
        assessments = result.scalars().all()

        items = []
        for fa in assessments:
            asset_name = fa.asset.name if fa.asset else "Unknown Asset"
            cve_id = "N/A"
            if fa.asset_vulnerability and fa.asset_vulnerability.vulnerability:
                cve_id = fa.asset_vulnerability.vulnerability.cve_id

            risk_score = fa.risk_assessment.final_risk_score if fa.risk_assessment else 0.0

            # Determine primary loss driver
            drivers = {
                "Downtime": fa.downtime_cost,
                "Revenue Interruption": fa.revenue_loss,
                "Data Breach Exposure": fa.data_breach_cost,
                "Disaster Recovery": fa.recovery_cost,
                "Regulatory Exposure": fa.regulatory_cost,
            }
            primary_driver = max(drivers, key=drivers.get) if drivers else "Direct Loss"

            items.append({
                "asset_vulnerability_id": fa.asset_vulnerability_id,
                "asset_name": asset_name,
                "cve_id": cve_id,
                "risk_score": round(float(risk_score), 2),
                "expected_loss": fa.expected_loss,
                "p90_loss": fa.p90_loss,
                "annual_expected_loss": fa.annual_expected_loss,
                "primary_loss_driver": primary_driver,
            })
        return items


financial_service = FinancialService()
