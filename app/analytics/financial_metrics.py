"""Financial metrics analytics module for executive loss quantification (Phase 9)."""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.business_service import BusinessService
from app.models.financial_assessment import FinancialAssessment
from app.models.financial_distribution import FinancialDistribution
from app.models.financial_profile import FinancialProfile


@dataclass
class FinancialSummaryData:
    expected_annual_loss: float
    p10: float
    p50: float
    p90: float
    p95: float
    maximum_modeled_loss: float
    currency: str
    assessment_count: int


class FinancialMetrics:
    """Aggregates and formats financial exposure metrics across organization, business services, and assets."""

    @classmethod
    async def get_financial_summary(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> FinancialSummaryData:
        """Compute organization-wide expected loss and percentile confidence intervals."""
        stmt = (
            select(FinancialAssessment)
            .options(selectinload(FinancialAssessment.distribution))
            .where(FinancialAssessment.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        assessments = list(res.scalars().all())

        if not assessments:
            # Fallback estimation from assets
            a_stmt = select(Asset).where(Asset.organization_id == organization_id)
            a_res = await db.execute(a_stmt)
            assets = list(a_res.scalars().all())
            val = sum(float(getattr(a, "business_value", 500000.0) or 500000.0) for a in assets) * 0.15
            return FinancialSummaryData(
                expected_annual_loss=round(val, 2),
                p10=round(val * 0.4, 2),
                p50=round(val * 0.85, 2),
                p90=round(val * 2.2, 2),
                p95=round(val * 2.8, 2),
                maximum_modeled_loss=round(val * 3.5, 2),
                currency="INR",
                assessment_count=0,
            )

        total_exp = sum(float(fa.expected_loss) for fa in assessments)
        total_p10 = sum(float(fa.p10_loss) for fa in assessments)
        total_p50 = sum(float(fa.p50_loss) for fa in assessments)
        total_p90 = sum(float(fa.p90_loss) for fa in assessments)
        total_p95 = sum(float(fa.p95_loss) for fa in assessments)
        max_loss = max((float(fa.p95_loss) * 1.2 for fa in assessments), default=total_exp * 2.5)

        return FinancialSummaryData(
            expected_annual_loss=round(total_exp, 2),
            p10=round(total_p10, 2),
            p50=round(total_p50, 2),
            p90=round(total_p90, 2),
            p95=round(total_p95, 2),
            maximum_modeled_loss=round(max_loss, 2),
            currency="INR",
            assessment_count=len(assessments),
        )

    @classmethod
    async def get_financial_risk_by_business_services(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> List[Dict[str, Any]]:
        """Group and sum financial loss exposure by Business Service."""
        stmt = (
            select(BusinessService)
            .where(BusinessService.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        services = list(res.scalars().all())

        results = []
        for s in services:
            # Determine linked assets and sum financial assessments
            fa_stmt = (
                select(FinancialAssessment)
                .join(Asset, FinancialAssessment.asset_id == Asset.id)
                .where(
                    Asset.business_service_id == s.id,
                    FinancialAssessment.organization_id == organization_id,
                )
            )
            fa_res = await db.execute(fa_stmt)
            fas = list(fa_res.scalars().all())

            exp_loss = sum(float(fa.expected_loss) for fa in fas)
            p90_loss = sum(float(fa.p90_loss) for fa in fas)

            # Fallback if no individual assessment rows
            if exp_loss == 0.0:
                crit_mult = 0.25 if s.criticality.value == "CRITICAL" else 0.15
                exp_loss = float(getattr(s, "annual_revenue_impact", 1000000.0) or 1000000.0) * crit_mult
                p90_loss = exp_loss * 2.4

            results.append(
                {
                    "service_id": str(s.id),
                    "service": s.name,
                    "criticality": s.criticality.value if hasattr(s.criticality, "value") else str(s.criticality),
                    "expected_loss": round(exp_loss, 2),
                    "p90_loss": round(p90_loss, 2),
                }
            )

        results.sort(key=lambda x: x["expected_loss"], reverse=True)
        return results

    @classmethod
    async def get_financial_risk_by_assets(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch top assets ranked by modeled financial exposure."""
        stmt = (
            select(Asset)
            .options(
                selectinload(Asset.business_service),
                selectinload(Asset.asset_vulnerabilities).selectinload(AssetVulnerability.financial_assessments),
                selectinload(Asset.asset_vulnerabilities).selectinload(AssetVulnerability.risk_assessment),
            )
            .where(Asset.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        assets = list(res.scalars().all())

        results = []
        for a in assets:
            total_exp = 0.0
            total_p90 = 0.0
            risk_scores = []

            for av in a.asset_vulnerabilities:
                if av.financial_assessments:
                    fa = av.financial_assessments[0]
                    total_exp += float(fa.expected_loss)
                    total_p90 += float(fa.p90_loss)
                if av.risk_assessment:
                    risk_scores.append(float(getattr(av.risk_assessment, "final_risk_score", getattr(av.risk_assessment, "risk_score", 50.0))))

            if total_exp == 0.0:
                val = float(getattr(a, "business_value", 500000.0) or 500000.0)
                total_exp = val * 0.20
                total_p90 = total_exp * 2.2

            avg_risk = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 50.0

            results.append(
                {
                    "asset_id": str(a.id),
                    "asset": a.name,
                    "business_service": a.business_service.name if a.business_service else None,
                    "criticality": a.criticality.value if hasattr(a.criticality, "value") else str(a.criticality),
                    "risk_score": avg_risk,
                    "expected_loss": round(total_exp, 2),
                    "p90_loss": round(total_p90, 2),
                }
            )

        results.sort(key=lambda x: x["expected_loss"], reverse=True)
        return results[:limit]
