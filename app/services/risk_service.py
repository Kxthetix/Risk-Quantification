"""RiskService orchestrating cyber risk calculations, history, summaries, and rules (Phase 5)."""
from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, BadRequestError, NotFoundError
from app.engines.risk_engine import RiskEngine, RiskEngineOutput, RiskFactorData
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    AssetCriticality,
    AuditAction,
    RiskAssessmentStatus,
    RiskLevel,
)
from app.models.evidence import Evidence
from app.models.risk_assessment import RiskAssessment, RiskHistory
from app.models.risk_factor import RiskFactor
from app.models.risk_rule import RiskRule
from app.models.user import User
from app.models.vulnerability import Vulnerability
from app.models.vulnerability_validation import VulnerabilityValidation
from app.schemas.risk import RiskConfigUpdate
from app.services.audit_service import audit_service


class RiskService:
    """Business logic service managing cyber risk calculations and reporting."""

    @staticmethod
    async def get_effective_rules(
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> Dict[str, RiskRule]:
        """Fetch system default risk rules and overlay organization-specific overrides."""
        stmt = (
            select(RiskRule)
            .where(
                (RiskRule.organization_id == organization_id)
                | (RiskRule.organization_id.is_(None))
            )
        )
        res = await db.execute(stmt)
        rules = res.scalars().all()

        rule_map: Dict[str, RiskRule] = {}
        # First load globals
        for r in rules:
            if r.organization_id is None:
                rule_map[r.factor] = r
        # Then override with tenant-specific
        for r in rules:
            if r.organization_id == organization_id:
                rule_map[r.factor] = r

        return rule_map

    @staticmethod
    async def calculate_risk_for_vulnerability(
        db: AsyncSession,
        asset_vulnerability_id: uuid.UUID,
        current_user: User,
        reason: Optional[str] = None,
    ) -> RiskAssessment:
        """Calculate or update the cyber risk assessment for a specific asset vulnerability."""
        # 1. Load AssetVulnerability with related models
        stmt = (
            select(AssetVulnerability)
            .options(
                selectinload(AssetVulnerability.asset),
                selectinload(AssetVulnerability.vulnerability),
            )
            .where(AssetVulnerability.id == asset_vulnerability_id)
        )
        res = await db.execute(stmt)
        av = res.scalar_one_or_none()
        if not av:
            raise NotFoundError(
                message=f"Asset vulnerability '{asset_vulnerability_id}' was not found.",
                error_code="ASSET_VULNERABILITY_NOT_FOUND",
            )

        asset: Asset = av.asset
        vuln: Vulnerability = av.vulnerability

        # 2. Strict tenant isolation
        if asset.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="You are not authorized to calculate risk for assets outside your organization.",
                error_code="FORBIDDEN_ASSET_ACCESS",
            )

        # 3. Load latest validation and evidence items
        val_stmt = select(VulnerabilityValidation).where(
            VulnerabilityValidation.asset_vulnerability_id == av.id
        )
        val_res = await db.execute(val_stmt)
        validation = val_res.scalar_one_or_none()

        ev_stmt = select(Evidence).where(
            (Evidence.asset_id == asset.id)
            & (
                (Evidence.asset_vulnerability_id == av.id)
                | (Evidence.asset_vulnerability_id.is_(None))
            )
        )
        ev_res = await db.execute(ev_stmt)
        evidence_list = list(ev_res.scalars().all())

        # 4. Fetch effective rules and max asset value for relative scaling
        rules = await RiskService.get_effective_rules(db, current_user.organization_id)

        max_val_stmt = (
            select(func.max(Asset.business_value))
            .where(Asset.organization_id == current_user.organization_id)
        )
        max_val_res = await db.execute(max_val_stmt)
        org_max_val = max_val_res.scalar_one_or_none()

        # 5. Execute Risk Engine
        output: RiskEngineOutput = RiskEngine.evaluate(
            asset=asset,
            asset_vulnerability=av,
            vulnerability=vuln,
            validation=validation,
            evidence_list=evidence_list,
            rules=rules,
            org_max_asset_value=float(org_max_val) if org_max_val else None,
        )

        # 6. Retrieve or create RiskAssessment
        ra_stmt = (
            select(RiskAssessment)
            .options(selectinload(RiskAssessment.factors))
            .where(RiskAssessment.asset_vulnerability_id == av.id)
        )
        ra_res = await db.execute(ra_stmt)
        existing_ra = ra_res.scalar_one_or_none()

        previous_score = None
        previous_level = None

        if not existing_ra:
            assessment = RiskAssessment(
                id=uuid.uuid4(),
                organization_id=asset.organization_id,
                asset_id=asset.id,
                asset_vulnerability_id=av.id,
                likelihood_score=output.likelihood_score,
                impact_score=output.impact_score,
                exposure_score=output.exposure_score,
                exploitability_score=output.exploitability_score,
                validation_score=output.validation_score,
                control_score=output.control_score,
                business_criticality_score=output.business_criticality_score,
                final_risk_score=output.final_risk_score,
                risk_level=output.risk_level,
                risk_method=output.risk_method,
                risk_model_version=output.risk_model_version,
                explanation=output.explanation,
                factors_snapshot=output.factors_snapshot,
                configuration_snapshot=output.configuration_snapshot,
                input_snapshot=output.input_snapshot,
                calculated_at=datetime.now(timezone.utc),
            )
            db.add(assessment)
        else:
            assessment = existing_ra
            previous_score = assessment.final_risk_score
            previous_level = assessment.risk_level.value

            assessment.likelihood_score = output.likelihood_score
            assessment.impact_score = output.impact_score
            assessment.exposure_score = output.exposure_score
            assessment.exploitability_score = output.exploitability_score
            assessment.validation_score = output.validation_score
            assessment.control_score = output.control_score
            assessment.business_criticality_score = output.business_criticality_score
            assessment.final_risk_score = output.final_risk_score
            assessment.risk_level = output.risk_level
            assessment.risk_method = output.risk_method
            assessment.risk_model_version = output.risk_model_version
            assessment.explanation = output.explanation
            assessment.factors_snapshot = output.factors_snapshot
            assessment.configuration_snapshot = output.configuration_snapshot
            assessment.input_snapshot = output.input_snapshot
            assessment.calculated_at = datetime.now(timezone.utc)

            # Clear existing factors to replace with fresh calculation
            for old_factor in list(assessment.factors):
                await db.delete(old_factor)

        # 7. Persist individual RiskFactor records
        for f in output.factors:
            factor_record = RiskFactor(
                id=uuid.uuid4(),
                risk_assessment_id=assessment.id,
                factor_name=f.name,
                raw_value=f.raw_value,
                normalized_value=f.normalized_value,
                weight=f.weight,
                contribution=f.contribution,
            )
            db.add(factor_record)

        # 8. Record audit history entry
        history_entry = RiskHistory(
            id=uuid.uuid4(),
            risk_assessment_id=assessment.id,
            previous_score=previous_score,
            new_score=output.final_risk_score,
            previous_level=previous_level,
            new_level=output.risk_level.value,
            reason=reason or f"Cyber risk evaluated under model v{output.risk_model_version}",
            changed_by=current_user.id,
            changed_at=datetime.now(timezone.utc),
        )
        db.add(history_entry)

        # 9. Audit trail
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.RISK_RECALCULATED if previous_score is not None else AuditAction.RISK_CALCULATED,
            resource_type="risk_assessment",
            resource_id=str(assessment.id),
            metadata={
                "asset_id": str(asset.id),
                "cve_id": vuln.cve_id,
                "score": output.final_risk_score,
                "level": output.risk_level.value,
            },
        )

        await db.commit()

        # Reload with factors
        stmt_reload = (
            select(RiskAssessment)
            .options(selectinload(RiskAssessment.factors))
            .where(RiskAssessment.id == assessment.id)
        )
        res_reload = await db.execute(stmt_reload)
        return res_reload.scalar_one()

    @staticmethod
    async def recalculate_risk(
        db: AsyncSession,
        risk_id: uuid.UUID,
        current_user: User,
        reason: Optional[str] = None,
    ) -> RiskAssessment:
        """Recalculate an existing risk assessment by ID."""
        stmt = select(RiskAssessment).where(RiskAssessment.id == risk_id)
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()
        if not assessment:
            raise NotFoundError(
                message=f"Risk assessment '{risk_id}' was not found.",
                error_code="RISK_ASSESSMENT_NOT_FOUND",
            )

        if assessment.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="You are not authorized to recalculate risk assessments outside your organization.",
                error_code="FORBIDDEN_RISK_ACCESS",
            )

        return await RiskService.calculate_risk_for_vulnerability(
            db=db,
            asset_vulnerability_id=assessment.asset_vulnerability_id,
            current_user=current_user,
            reason=reason or "Manual risk recalculation triggered",
        )

    @staticmethod
    async def calculate_bulk_risk(
        db: AsyncSession,
        current_user: User,
        asset_ids: Optional[List[uuid.UUID]] = None,
        all_organization_assets: bool = False,
    ) -> int:
        """Run risk calculations in bulk across specified or all organizational assets."""
        query = (
            select(AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(Asset.organization_id == current_user.organization_id)
        )
        if not all_organization_assets and asset_ids:
            query = query.where(Asset.id.in_(asset_ids))

        res = await db.execute(query)
        av_ids = res.scalars().all()

        calculated_count = 0
        for av_id in av_ids:
            await RiskService.calculate_risk_for_vulnerability(
                db=db,
                asset_vulnerability_id=av_id,
                current_user=current_user,
                reason="Bulk risk calculation batch",
            )
            calculated_count += 1

        return calculated_count

    @staticmethod
    async def get_risk_assessment_by_id(
        db: AsyncSession,
        risk_id: uuid.UUID,
        current_user: User,
    ) -> RiskAssessment:
        """Fetch a detailed risk assessment by its ID with tenant validation."""
        stmt = (
            select(RiskAssessment)
            .options(selectinload(RiskAssessment.factors))
            .where(RiskAssessment.id == risk_id)
        )
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()
        if not assessment:
            raise NotFoundError(
                message=f"Risk assessment '{risk_id}' was not found.",
                error_code="RISK_ASSESSMENT_NOT_FOUND",
            )

        if assessment.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="You are not authorized to view risk assessments outside your organization.",
                error_code="FORBIDDEN_RISK_ACCESS",
            )

        return assessment

    @staticmethod
    async def get_asset_risk_summary(
        db: AsyncSession,
        asset_id: uuid.UUID,
        current_user: User,
    ) -> Dict[str, Any]:
        """Aggregate cyber risk profile for a specific asset."""
        # 1. Verify asset belongs to organization
        asset_res = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.organization_id == current_user.organization_id,
            )
        )
        asset = asset_res.scalar_one_or_none()
        if not asset:
            raise NotFoundError(
                message=f"Asset '{asset_id}' was not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        # 2. Query assessments for this asset
        stmt = select(RiskAssessment).where(
            RiskAssessment.asset_id == asset_id,
            RiskAssessment.organization_id == current_user.organization_id,
        )
        res = await db.execute(stmt)
        assessments = res.scalars().all()

        if not assessments:
            return {
                "asset_id": asset.id,
                "asset_name": asset.name,
                "overall_risk_score": 0.0,
                "risk_level": RiskLevel.LOW,
                "open_findings": 0,
                "critical_findings": 0,
                "high_findings": 0,
            }

        scores = [a.final_risk_score for a in assessments]
        # Weighted aggregate: highest risk finding heavily influences the asset posture
        max_score = max(scores)
        avg_score = sum(scores) / len(scores)
        overall_score = round(0.70 * max_score + 0.30 * avg_score, 1)

        # Classify asset overall risk level
        if overall_score <= 20.0:
            level = RiskLevel.LOW
        elif overall_score <= 40.0:
            level = RiskLevel.MEDIUM
        elif overall_score <= 60.0:
            level = RiskLevel.HIGH
        elif overall_score <= 80.0:
            level = RiskLevel.VERY_HIGH
        else:
            level = RiskLevel.CRITICAL

        critical_count = sum(1 for a in assessments if a.risk_level == RiskLevel.CRITICAL)
        high_count = sum(1 for a in assessments if a.risk_level in (RiskLevel.HIGH, RiskLevel.VERY_HIGH))

        return {
            "asset_id": asset.id,
            "asset_name": asset.name,
            "overall_risk_score": overall_score,
            "risk_level": level,
            "open_findings": len(assessments),
            "critical_findings": critical_count,
            "high_findings": high_count,
        }

    @staticmethod
    async def get_organization_risk_summary(
        db: AsyncSession,
        current_user: User,
    ) -> Dict[str, Any]:
        """Aggregate portfolio-wide organizational cyber risk profile."""
        org_id = current_user.organization_id

        # Total and critical assets
        assets_res = await db.execute(
            select(Asset).where(Asset.organization_id == org_id)
        )
        all_assets = assets_res.scalars().all()
        total_assets = len(all_assets)
        critical_assets = sum(1 for a in all_assets if a.criticality == AssetCriticality.CRITICAL)

        # All assessments in organization
        ra_res = await db.execute(
            select(RiskAssessment).where(RiskAssessment.organization_id == org_id)
        )
        all_assessments = ra_res.scalars().all()

        if not all_assessments:
            return {
                "overall_risk_score": 0.0,
                "risk_level": RiskLevel.LOW,
                "assets": total_assets,
                "critical_assets": critical_assets,
                "critical_findings": 0,
                "high_findings": 0,
            }

        # Weighted calculation by asset importance rather than simple average
        weighted_sum = sum(
            a.final_risk_score * (a.business_criticality_score / 100.0)
            for a in all_assessments
        )
        weight_normalizer = sum(
            (a.business_criticality_score / 100.0) for a in all_assessments
        )
        if weight_normalizer > 0:
            overall_score = round(weighted_sum / weight_normalizer, 1)
        else:
            overall_score = round(sum(a.final_risk_score for a in all_assessments) / len(all_assessments), 1)

        # Classify organizational risk level
        if overall_score <= 20.0:
            level = RiskLevel.LOW
        elif overall_score <= 40.0:
            level = RiskLevel.MEDIUM
        elif overall_score <= 60.0:
            level = RiskLevel.HIGH
        elif overall_score <= 80.0:
            level = RiskLevel.VERY_HIGH
        else:
            level = RiskLevel.CRITICAL

        critical_findings = sum(1 for a in all_assessments if a.risk_level == RiskLevel.CRITICAL)
        high_findings = sum(1 for a in all_assessments if a.risk_level in (RiskLevel.HIGH, RiskLevel.VERY_HIGH))

        return {
            "overall_risk_score": overall_score,
            "risk_level": level,
            "assets": total_assets,
            "critical_assets": critical_assets,
            "critical_findings": critical_findings,
            "high_findings": high_findings,
        }

    @staticmethod
    async def get_risk_distribution(
        db: AsyncSession,
        current_user: User,
    ) -> Dict[str, int]:
        """Distribution of risk findings across qualitative tiers."""
        stmt = (
            select(RiskAssessment.risk_level, func.count(RiskAssessment.id))
            .where(RiskAssessment.organization_id == current_user.organization_id)
            .group_by(RiskAssessment.risk_level)
        )
        res = await db.execute(stmt)
        counts = dict(res.all())

        return {
            "LOW": counts.get(RiskLevel.LOW, 0),
            "MEDIUM": counts.get(RiskLevel.MEDIUM, 0),
            "HIGH": counts.get(RiskLevel.HIGH, 0),
            "VERY_HIGH": counts.get(RiskLevel.VERY_HIGH, 0),
            "CRITICAL": counts.get(RiskLevel.CRITICAL, 0),
        }

    @staticmethod
    async def get_top_risks(
        db: AsyncSession,
        current_user: User,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch prioritized top risk findings based on score, criticality, and known exploitation."""
        stmt = (
            select(RiskAssessment, Asset, Vulnerability)
            .join(Asset, RiskAssessment.asset_id == Asset.id)
            .join(AssetVulnerability, RiskAssessment.asset_vulnerability_id == AssetVulnerability.id)
            .join(Vulnerability, AssetVulnerability.vulnerability_id == Vulnerability.id)
            .where(RiskAssessment.organization_id == current_user.organization_id)
            .order_by(
                desc(RiskAssessment.final_risk_score),
                desc(RiskAssessment.business_criticality_score),
                desc(Vulnerability.known_exploited),
            )
            .limit(limit)
        )
        res = await db.execute(stmt)
        rows = res.all()

        items: List[Dict[str, Any]] = []
        for ra, asset, vuln in rows:
            items.append({
                "risk_id": ra.id,
                "asset_id": asset.id,
                "asset": asset.name,
                "cve_id": vuln.cve_id,
                "risk_score": ra.final_risk_score,
                "risk_level": ra.risk_level,
                "criticality": asset.criticality.value,
                "known_exploited": bool(vuln.known_exploited),
                "business_value": float(asset.business_value or 0.0),
            })
        return items

    @staticmethod
    async def get_risk_config(
        db: AsyncSession,
        current_user: User,
    ) -> Dict[str, Any]:
        """Fetch the active risk configuration for the user's organization."""
        rules = await RiskService.get_effective_rules(db, current_user.organization_id)
        rule_items = []
        weights_dict = dict(RiskEngine.DEFAULT_WEIGHTS)

        for factor, rule in rules.items():
            rule_items.append({
                "factor": rule.factor,
                "weight": rule.weight,
                "enabled": rule.enabled,
                "parameters": rule.parameters,
            })
            if rule.enabled:
                weights_dict[factor] = rule.weight

        return {
            "model_version": RiskEngine.DEFAULT_MODEL_VERSION,
            "weights": weights_dict,
            "thresholds": RiskEngine.DEFAULT_THRESHOLDS,
            "rules": rule_items,
        }

    @staticmethod
    async def update_risk_config(
        db: AsyncSession,
        payload: RiskConfigUpdate,
        current_user: User,
    ) -> Dict[str, Any]:
        """Update factor weights and rules with validation."""
        org_id = current_user.organization_id

        if payload.weights:
            # Validate non-negative weights
            for factor_name, weight in payload.weights.items():
                if weight < 0.0:
                    raise BadRequestError(
                        message=f"Weight for factor '{factor_name}' cannot be negative.",
                        error_code="INVALID_FACTOR_WEIGHT",
                    )

            for factor_name, weight in payload.weights.items():
                # Check for existing rule override
                stmt = select(RiskRule).where(
                    RiskRule.organization_id == org_id,
                    RiskRule.factor == factor_name,
                )
                res = await db.execute(stmt)
                rule = res.scalar_one_or_none()
                if rule:
                    rule.weight = weight
                else:
                    new_rule = RiskRule(
                        id=uuid.uuid4(),
                        organization_id=org_id,
                        name=f"Custom {factor_name} Weight",
                        factor=factor_name,
                        weight=weight,
                        enabled=True,
                    )
                    db.add(new_rule)

        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.RISK_CONFIG_UPDATED,
            resource_type="risk_config",
            resource_id=str(org_id),
            metadata={"updated_weights": payload.weights},
        )

        await db.commit()
        return await RiskService.get_risk_config(db, current_user)


risk_service = RiskService()
