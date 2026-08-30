"""Attack Path and Attack Surface analytics module (Phase 9)."""
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.attack_path import AttackPath
from app.models.enums import AssetCriticality, AssetVulnerabilityStatus, VulnerabilitySeverity
from app.models.vulnerability import Vulnerability


@dataclass
class AttackSurfaceData:
    total_assets: int
    internet_facing: int
    critical_assets: int
    known_exploited_assets: int
    assets_with_critical_vulns: int


class AttackPathMetrics:
    """Aggregates attack surface metrics and sorts dangerous attack paths."""

    @classmethod
    async def get_attack_surface(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> AttackSurfaceData:
        """Compute structural attack surface perimeter metrics."""
        stmt = (
            select(Asset)
            .options(
                selectinload(Asset.asset_vulnerabilities).selectinload(AssetVulnerability.vulnerability),
            )
            .where(Asset.organization_id == organization_id)
        )
        res = await db.execute(stmt)
        assets = list(res.scalars().all())

        total = len(assets)
        internet_facing = 0
        critical_assets = 0
        known_exploited_assets = 0
        critical_vuln_assets = 0

        for a in assets:
            if getattr(a, "internet_exposed", False):
                internet_facing += 1

            if a.criticality == AssetCriticality.CRITICAL:
                critical_assets += 1

            has_kev = False
            has_crit_vuln = False
            for av in a.asset_vulnerabilities:
                if av.status == AssetVulnerabilityStatus.OPEN and av.vulnerability:
                    if getattr(av.vulnerability, "known_exploited", False):
                        has_kev = True
                    if av.vulnerability.severity == VulnerabilitySeverity.CRITICAL:
                        has_crit_vuln = True

            if has_kev:
                known_exploited_assets += 1
            if has_crit_vuln:
                critical_vuln_assets += 1

        return AttackSurfaceData(
            total_assets=total,
            internet_facing=internet_facing,
            critical_assets=critical_assets,
            known_exploited_assets=known_exploited_assets,
            assets_with_critical_vulns=critical_vuln_assets,
        )

    @classmethod
    async def get_top_attack_paths(
        cls,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch highest-severity attack paths ranked by compounded risk and financial exposure."""
        stmt = (
            select(AttackPath)
            .options(selectinload(AttackPath.target_asset))
            .where(AttackPath.organization_id == organization_id)
            .order_by(desc(AttackPath.path_score))
            .limit(limit)
        )
        res = await db.execute(stmt)
        paths = list(res.scalars().all())

        results = []
        for p in paths:
            results.append(
                {
                    "path_id": str(p.id),
                    "entry_point": p.source_node,
                    "target": p.target_node,
                    "target_asset_name": p.target_asset.name if p.target_asset else None,
                    "path_length": p.path_length,
                    "likelihood": round(p.likelihood, 2),
                    "impact": round(p.impact, 1),
                    "path_score": round(p.path_score, 1),
                    "financial_exposure": round(p.financial_exposure, 2),
                }
            )

        return results
