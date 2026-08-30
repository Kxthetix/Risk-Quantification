"""Risk metrics analytics module for risk overview, heatmaps, and distribution (Phase 9)."""
from dataclasses import dataclass, field
import math
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import AssetCriticality, AssetVulnerabilityStatus, RiskLevel
from app.models.financial_assessment import FinancialAssessment
from app.models.risk_assessment import RiskAssessment
from app.models.vulnerability import Vulnerability


@dataclass
class RiskOverviewData:
    score: float
    level: str
    distribution: Dict[str, int]
    assessed_count: int


@dataclass
class HeatmapCell:
    likelihood: int  # 1 to 5
    impact: int  # 1 to 5
    finding_count: int
    asset_count: int
    financial_exposure: float


@dataclass
class RiskHeatmapData:
    dimensions: Dict[str, int]
    cells: List[HeatmapCell]


class RiskMetrics:
    """Computes cyber risk distributions, multi-dimensional heatmaps, and organizational risk views."""

    @classmethod
    async def get_risk_overview(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> RiskOverviewData:
        """Compute organization overall risk score and distribution."""
        stmt = (
            select(RiskAssessment)
            .join(AssetVulnerability, RiskAssessment.asset_vulnerability_id == AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(
                Asset.organization_id == organization_id,
                AssetVulnerability.status == AssetVulnerabilityStatus.OPEN,
            )
        )
        res = await db.execute(stmt)
        assessments = list(res.scalars().all())

        dist = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        total_score = 0.0

        for r in assessments:
            score = float(getattr(r, "final_risk_score", getattr(r, "risk_score", 0.0)))
            total_score += score
            if score >= 80.0:
                dist["critical"] += 1
            elif score >= 60.0:
                dist["high"] += 1
            elif score >= 40.0:
                dist["medium"] += 1
            else:
                dist["low"] += 1

        n = len(assessments)
        avg_score = round(total_score / n, 1) if n > 0 else 0.0

        if avg_score >= 80.0:
            level = "CRITICAL"
        elif avg_score >= 60.0:
            level = "HIGH"
        elif avg_score >= 40.0:
            level = "MEDIUM"
        elif avg_score > 0.0:
            level = "LOW"
        else:
            level = "NONE"

        return RiskOverviewData(
            score=avg_score,
            level=level,
            distribution=dist,
            assessed_count=n,
        )

    @classmethod
    async def get_risk_heatmap(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> RiskHeatmapData:
        """Compute 5x5 Likelihood x Impact matrix with finding counts and financial exposures."""
        stmt = (
            select(RiskAssessment)
            .options(
                selectinload(RiskAssessment.asset_vulnerability).selectinload(AssetVulnerability.financial_assessments),
            )
            .join(AssetVulnerability, RiskAssessment.asset_vulnerability_id == AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(
                Asset.organization_id == organization_id,
                AssetVulnerability.status == AssetVulnerabilityStatus.OPEN,
            )
        )
        res = await db.execute(stmt)
        risks = list(res.scalars().all())

        # 5x5 grid map: (likelihood_bin, impact_bin) -> cell data
        grid: Dict[tuple, Dict[str, Any]] = {}
        for l in range(1, 6):
            for i in range(1, 6):
                grid[(l, i)] = {"findings": 0, "assets": set(), "exposure": 0.0}

        for r in risks:
            # Map likelihood (0-100) to 1-5 bin
            l_score = float(getattr(r, "likelihood_score", 50.0))
            l_bin = max(1, min(5, math.ceil(l_score / 20.0)))

            # Map impact (0-100) to 1-5 bin
            i_score = float(getattr(r, "impact_score", 50.0))
            i_bin = max(1, min(5, math.ceil(i_score / 20.0)))

            cell = grid[(l_bin, i_bin)]
            cell["findings"] += 1
            if r.asset_id:
                cell["assets"].add(r.asset_id)

            # Accumulate financial exposure
            av = r.asset_vulnerability
            if av and av.financial_assessments:
                cell["exposure"] += float(av.financial_assessments[0].expected_loss)

        cells = [
            HeatmapCell(
                likelihood=l,
                impact=i,
                finding_count=grid[(l, i)]["findings"],
                asset_count=len(grid[(l, i)]["assets"]),
                financial_exposure=round(grid[(l, i)]["exposure"], 2),
            )
            for l in range(1, 6)
            for i in range(1, 6)
        ]

        return RiskHeatmapData(
            dimensions={"likelihood": 5, "impact": 5},
            cells=cells,
        )

    @classmethod
    async def get_top_risks(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch top cyber risk findings ranked by contextual multi-factor risk and loss."""
        stmt = (
            select(AssetVulnerability)
            .options(
                selectinload(AssetVulnerability.asset),
                selectinload(AssetVulnerability.vulnerability),
                selectinload(AssetVulnerability.risk_assessment),
                selectinload(AssetVulnerability.financial_assessments),
            )
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(
                Asset.organization_id == organization_id,
                AssetVulnerability.status == AssetVulnerabilityStatus.OPEN,
            )
        )
        res = await db.execute(stmt)
        findings = list(res.scalars().all())

        results = []
        for av in findings:
            risk_score = 50.0
            if av.risk_assessment:
                risk_score = float(getattr(av.risk_assessment, "final_risk_score", getattr(av.risk_assessment, "risk_score", 50.0)))
            elif av.vulnerability and av.vulnerability.cvss_score:
                risk_score = float(av.vulnerability.cvss_score) * 10.0

            exp_loss = 0.0
            if av.financial_assessments:
                exp_loss = float(av.financial_assessments[0].expected_loss)

            vuln = av.vulnerability
            asset = av.asset

            p_level = "CRITICAL" if risk_score >= 80.0 else "HIGH" if risk_score >= 60.0 else "MEDIUM"

            results.append(
                {
                    "finding_id": str(av.id),
                    "asset": asset.name if asset else "Unknown Asset",
                    "cve_id": vuln.cve_id if vuln else None,
                    "risk_score": round(risk_score, 1),
                    "expected_loss": round(exp_loss, 2),
                    "attack_paths": 1 if asset and getattr(asset, "internet_exposed", False) else 0,
                    "known_exploited": bool(vuln.known_exploited if vuln else False),
                    "priority": p_level,
                }
            )

        # Sort descending by composite ranking: risk_score * 0.6 + loss * 0.4
        results.sort(key=lambda x: (x["risk_score"], x["expected_loss"]), reverse=True)
        return results[:limit]
