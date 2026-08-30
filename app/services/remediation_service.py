"""Remediation Service for treatment lifecycle, prioritization, and simulation (Phase 8)."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.engines.remediation_priority_engine import FindingContext, RemediationPriorityEngine
from app.engines.risk_reduction_engine import RiskReductionEngine
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.attack_path import AttackPath
from app.models.enums import (
    AssetVulnerabilityStatus,
    AuditAction,
    RemediationPriorityLevel,
    RemediationStatus,
    RemediationType,
    ValidationStatus,
)
from app.models.financial_assessment import FinancialAssessment
from app.models.remediation import Remediation
from app.models.remediation_cost import RemediationCost
from app.models.risk_assessment import RiskAssessment
from app.models.user import User
from app.schemas.remediation import (
    RemediationCreate,
    RemediationSimulateResponse,
    RemediationUpdate,
    RemediationVerifyRequest,
    RiskAcceptanceRequest,
    TopRemediationItem,
    TopRemediationsResponse,
)
from app.services.audit_service import audit_service


class RemediationService:
    """Manages the full lifecycle of vulnerability treatments and optimization recommendations."""

    async def create_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        payload: RemediationCreate,
        current_user: User,
    ) -> Remediation:
        """Create and prioritize a remediation action."""
        av = None
        if payload.asset_vulnerability_id:
            av_stmt = (
                select(AssetVulnerability)
                .options(
                    selectinload(AssetVulnerability.asset),
                    selectinload(AssetVulnerability.vulnerability),
                    selectinload(AssetVulnerability.risk_assessment),
                    selectinload(AssetVulnerability.financial_assessments),
                    selectinload(AssetVulnerability.validation),
                )
                .where(AssetVulnerability.id == payload.asset_vulnerability_id)
            )
            av_res = await db.execute(av_stmt)
            av = av_res.scalar_one_or_none()
            if not av or (av.asset and av.asset.organization_id != organization_id):
                raise NotFoundError(
                    message=f"Finding {payload.asset_vulnerability_id} not found in this organization.",
                    error_code="FINDING_NOT_FOUND",
                )

        # Build Finding Context for prioritization
        context = await self._build_finding_context(db, organization_id, av, payload.estimated_cost)
        priority_res = RemediationPriorityEngine.calculate_priority(context)

        # Calculate initial risk and financial loss reduction estimate
        initial_risk = context.risk_score
        expected_loss = context.expected_loss
        sim_res = RiskReductionEngine.simulate_reduction(
            initial_risk=initial_risk,
            expected_loss=expected_loss,
            remediation_type=payload.remediation_type,
            implementation_cost=payload.estimated_cost,
            attack_paths_count=context.attack_path_count,
        )

        remediation = Remediation(
            organization_id=organization_id,
            asset_vulnerability_id=payload.asset_vulnerability_id,
            title=payload.title,
            description=payload.description,
            remediation_type=payload.remediation_type,
            status=RemediationStatus.OPEN,
            priority_score=priority_res.priority_score,
            priority_level=priority_res.priority_level,
            estimated_cost=payload.estimated_cost,
            estimated_duration_hours=payload.estimated_duration_hours,
            risk_reduction=sim_res.risk_reduction,
            expected_loss_reduction=sim_res.expected_loss_reduction,
            owner=payload.owner,
            due_date=payload.due_date,
            depends_on_remediation_id=payload.depends_on_remediation_id,
        )
        db.add(remediation)
        await db.flush()

        if payload.cost_details:
            cost_row = RemediationCost(
                remediation_id=remediation.id,
                minimum_cost=payload.cost_details.minimum_cost,
                most_likely_cost=payload.cost_details.most_likely_cost,
                maximum_cost=payload.cost_details.maximum_cost,
                currency=payload.cost_details.currency,
                labor_cost=payload.cost_details.labor_cost,
                technology_cost=payload.cost_details.technology_cost,
                consulting_cost=payload.cost_details.consulting_cost,
                downtime_cost=payload.cost_details.downtime_cost,
                licensing_cost=payload.cost_details.licensing_cost,
                recurring_cost=payload.cost_details.recurring_cost,
                one_time_cost=payload.cost_details.one_time_cost,
                confidence=payload.cost_details.confidence,
            )
            db.add(cost_row)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_CREATED,
            resource_type="remediation",
            resource_id=str(remediation.id),
            metadata={"title": remediation.title, "priority_score": remediation.priority_score},
        )

        await db.commit()
        return await self.get_remediation(db, organization_id, remediation.id)

    async def get_remediations(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        status: Optional[RemediationStatus] = None,
        priority_level: Optional[RemediationPriorityLevel] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Remediation]:
        """List remediations for an organization with optional filtering."""
        stmt = (
            select(Remediation)
            .options(
                selectinload(Remediation.remediation_cost),
                selectinload(Remediation.asset_vulnerability),
            )
            .where(Remediation.organization_id == organization_id)
        )
        if status:
            stmt = stmt.where(Remediation.status == status)
        if priority_level:
            stmt = stmt.where(Remediation.priority_level == priority_level)

        stmt = stmt.order_by(desc(Remediation.priority_score)).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
    ) -> Remediation:
        """Fetch an individual remediation ensuring multi-tenant isolation."""
        stmt = (
            select(Remediation)
            .options(
                selectinload(Remediation.remediation_cost),
                selectinload(Remediation.asset_vulnerability).selectinload(AssetVulnerability.asset),
                selectinload(Remediation.asset_vulnerability).selectinload(AssetVulnerability.vulnerability),
            )
            .where(
                Remediation.id == remediation_id,
                Remediation.organization_id == organization_id,
            )
        )
        result = await db.execute(stmt)
        rem = result.scalar_one_or_none()
        if not rem:
            raise NotFoundError(
                message=f"Remediation {remediation_id} not found.",
                error_code="REMEDIATION_NOT_FOUND",
            )
        return rem

    async def update_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
        payload: RemediationUpdate,
        current_user: User,
    ) -> Remediation:
        """Update remediation details or status."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        update_data = payload.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(rem, k, v)

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_UPDATED,
            resource_type="remediation",
            resource_id=str(rem.id),
            metadata={"updated_fields": list(update_data.keys())},
        )
        await db.commit()
        return await self.get_remediation(db, organization_id, rem.id)

    async def delete_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete a remediation."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        await db.delete(rem)
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_DELETED,
            resource_type="remediation",
            resource_id=str(remediation_id),
            metadata={},
        )
        await db.commit()

    async def complete_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
        current_user: User,
    ) -> Remediation:
        """Mark remediation COMPLETED (awaiting empirical verification)."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        rem.status = RemediationStatus.COMPLETED
        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_COMPLETED,
            resource_type="remediation",
            resource_id=str(rem.id),
            metadata={"status": "COMPLETED"},
        )
        await db.commit()
        return await self.get_remediation(db, organization_id, rem.id)

    async def verify_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
        payload: RemediationVerifyRequest,
        current_user: User,
    ) -> Remediation:
        """Empirically verify remediation, close the finding, and recalculate risk."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        rem.status = RemediationStatus.VERIFIED
        rem.verification_date = datetime.now(timezone.utc)
        rem.verification_evidence = payload.evidence or {"notes": payload.verification_notes}

        # If linked to asset vulnerability, resolve the finding
        if rem.asset_vulnerability_id:
            av = await db.get(AssetVulnerability, rem.asset_vulnerability_id)
            if av:
                av.status = AssetVulnerabilityStatus.RESOLVED

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_VERIFIED,
            resource_type="remediation",
            resource_id=str(rem.id),
            metadata={"status": "VERIFIED"},
        )
        await db.commit()
        return await self.get_remediation(db, organization_id, rem.id)

    async def accept_risk(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
        payload: RiskAcceptanceRequest,
        current_user: User,
    ) -> Remediation:
        """Formally accept risk with governance approval and mandatory expiry."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        rem.status = RemediationStatus.ACCEPTED_RISK
        rem.risk_acceptance_reason = payload.reason
        rem.risk_accepted_by = payload.approved_by
        rem.risk_accepted_at = datetime.now(timezone.utc)
        rem.risk_acceptance_expiry = payload.expiry_date

        await audit_service.log(
            db=db,
            user=current_user,
            action=AuditAction.REMEDIATION_RISK_ACCEPTED,
            resource_type="remediation",
            resource_id=str(rem.id),
            metadata={"approved_by": payload.approved_by, "expiry_date": str(payload.expiry_date)},
        )
        await db.commit()
        return await self.get_remediation(db, organization_id, rem.id)

    async def simulate_remediation(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        remediation_id: uuid.UUID,
    ) -> RemediationSimulateResponse:
        """Simulate pre- and post-remediation risk, financial loss, ROI, and TCO."""
        rem = await self.get_remediation(db, organization_id, remediation_id)
        av = None
        if rem.asset_vulnerability_id:
            av_stmt = (
                select(AssetVulnerability)
                .options(
                    selectinload(AssetVulnerability.asset),
                    selectinload(AssetVulnerability.vulnerability),
                    selectinload(AssetVulnerability.risk_assessment),
                    selectinload(AssetVulnerability.financial_assessments),
                )
                .where(AssetVulnerability.id == rem.asset_vulnerability_id)
            )
            av_res = await db.execute(av_stmt)
            av = av_res.scalar_one_or_none()

        context = await self._build_finding_context(db, organization_id, av, rem.estimated_cost)
        sim = RiskReductionEngine.simulate_reduction(
            initial_risk=context.risk_score,
            expected_loss=context.expected_loss,
            remediation_type=rem.remediation_type,
            implementation_cost=rem.estimated_cost,
            horizon_years=1,
            attack_paths_count=context.attack_path_count,
        )

        sim_3yr = RiskReductionEngine.simulate_reduction(
            initial_risk=context.risk_score,
            expected_loss=context.expected_loss,
            remediation_type=rem.remediation_type,
            implementation_cost=rem.estimated_cost,
            horizon_years=3,
            attack_paths_count=context.attack_path_count,
        )

        return RemediationSimulateResponse(
            remediation_id=rem.id,
            title=rem.title,
            current_risk=sim.initial_risk,
            residual_risk=sim.residual_risk,
            risk_reduction=sim.risk_reduction,
            current_expected_loss=sim.expected_loss_before,
            residual_expected_loss=sim.expected_loss_after,
            expected_loss_reduction=sim.expected_loss_reduction,
            implementation_cost=rem.estimated_cost,
            roi=sim.roi,
            risk_reduction_per_rupee=sim.risk_reduction_per_rupee,
            attack_paths_reduced=sim.attack_paths_reduced,
            tco_1yr=sim.tco,
            tco_3yr=sim_3yr.tco,
        )

    async def get_top_remediations(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        limit: int = 10,
        priority_level: Optional[RemediationPriorityLevel] = None,
        asset_id: Optional[uuid.UUID] = None,
        max_cost: Optional[float] = None,
    ) -> TopRemediationsResponse:
        """Get prioritized top remediation recommendations with justification reasons."""
        stmt = (
            select(Remediation)
            .options(
                selectinload(Remediation.asset_vulnerability).selectinload(AssetVulnerability.asset),
                selectinload(Remediation.asset_vulnerability).selectinload(AssetVulnerability.vulnerability),
            )
            .where(
                Remediation.organization_id == organization_id,
                Remediation.status.in_([RemediationStatus.OPEN, RemediationStatus.PLANNED]),
            )
        )
        if priority_level:
            stmt = stmt.where(Remediation.priority_level == priority_level)
        if max_cost is not None:
            stmt = stmt.where(Remediation.estimated_cost <= max_cost)

        stmt = stmt.order_by(desc(Remediation.priority_score)).limit(limit)
        res = await db.execute(stmt)
        remediations = list(res.scalars().all())

        items: List[TopRemediationItem] = []
        for r in remediations:
            asset_name = None
            cve_id = None
            av = r.asset_vulnerability
            if av:
                if av.asset:
                    asset_name = av.asset.name
                if av.vulnerability:
                    cve_id = av.vulnerability.cve_id

            cost_metric = max(1.0, r.estimated_cost)
            roi = round(((r.expected_loss_reduction - cost_metric) / cost_metric) * 100.0, 1) if r.estimated_cost > 0 else 0.0
            rrpr = round(r.expected_loss_reduction / cost_metric, 2) if r.estimated_cost > 0 else 0.0

            context = await self._build_finding_context(db, organization_id, av, r.estimated_cost)
            p_res = RemediationPriorityEngine.calculate_priority(context)

            items.append(
                TopRemediationItem(
                    remediation_id=r.id,
                    title=r.title,
                    remediation_type=r.remediation_type.value,
                    priority_score=r.priority_score,
                    priority_level=r.priority_level.value,
                    estimated_cost=r.estimated_cost,
                    risk_reduction=r.risk_reduction,
                    expected_loss_reduction=r.expected_loss_reduction,
                    roi=roi,
                    risk_reduction_per_rupee=rrpr,
                    attack_paths_reduced=context.attack_path_count or 1,
                    asset_name=asset_name,
                    cve_id=cve_id,
                    justifications=p_res.justifications,
                )
            )

        return TopRemediationsResponse(items=items, total_remediations=len(items))

    async def _build_finding_context(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        av: Optional[AssetVulnerability],
        estimated_cost: float,
    ) -> FindingContext:
        """Extract multi-phase context (Risk, Financial, Attack Paths) for a finding."""
        if not av:
            return FindingContext(
                risk_score=75.0,
                expected_loss=1000000.0,
                p90_loss=2500000.0,
                estimated_cost=estimated_cost,
            )

        asset: Optional[Asset] = av.asset
        vuln = av.vulnerability
        risk_score = 60.0
        if av.risk_assessment:
            risk_score = float(getattr(av.risk_assessment, "final_risk_score", getattr(av.risk_assessment, "risk_score", 60.0)))
        elif vuln and vuln.cvss_score:
            risk_score = float(vuln.cvss_score) * 10.0

        expected_loss = 0.0
        p90_loss = 0.0
        if av.financial_assessments:
            fa = av.financial_assessments[0]
            expected_loss = float(fa.expected_loss)
            p90_loss = float(fa.p90_loss)
        elif asset:
            # Fallback estimation based on asset value
            expected_loss = float(getattr(asset, "business_value", 500000.0) or 500000.0) * (risk_score / 100.0)
            p90_loss = expected_loss * 2.2

        # Check attack paths
        path_count = 0
        max_path_score = 0.0
        if asset:
            p_stmt = select(AttackPath).where(
                AttackPath.organization_id == organization_id,
                AttackPath.target_asset_id == asset.id,
            )
            p_res = await db.execute(p_stmt)
            paths = list(p_res.scalars().all())
            path_count = len(paths)
            if paths:
                max_path_score = max(p.path_score for p in paths)

        return FindingContext(
            risk_score=risk_score,
            expected_loss=expected_loss,
            p90_loss=p90_loss,
            attack_path_count=path_count,
            max_attack_path_score=max_path_score,
            is_chokepoint=path_count >= 2,
            chokepoint_reduction_potential=0.8 if path_count >= 2 else 0.3,
            criticality=asset.criticality if asset and asset.criticality else FindingContext.criticality,
            exploit_available=vuln.exploit_available if vuln and vuln.exploit_available else FindingContext.exploit_available,
            known_exploited=bool(vuln.known_exploited if vuln else False),
            validation_confidence=float(getattr(av.validation, "confidence_score", 0.8) or 0.8) if av.validation else 0.8,
            is_internet_exposed=bool(getattr(asset, "internet_exposed", False)),
            estimated_cost=estimated_cost,
        )


remediation_service = RemediationService()
