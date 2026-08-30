"""Vulnerability Validation Service orchestrating validation workflows, history, statistics, and review queues."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, NotFoundError
from app.engines.validation_engine import ValidationEngine, ValidationEngineOutput
from app.models.asset import Asset
from app.models.asset_software import AssetSoftware
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import (
    AuditAction,
    ValidationStatus,
)
from app.models.evidence import Evidence
from app.models.software import Software
from app.models.user import User, UserRole
from app.models.vulnerability import Vulnerability, VulnerabilityCPE
from app.models.vulnerability_validation import ValidationHistory, VulnerabilityValidation
from app.services.audit_service import audit_service
from app.services.validation_rule_service import validation_rule_service


class ValidationService:
    """Service providing end-to-end vulnerability validation operations."""

    @staticmethod
    async def run_validation(
        db: AsyncSession,
        asset_vulnerability_id: uuid.UUID,
        current_user: User,
        reason_note: Optional[str] = None,
    ) -> VulnerabilityValidation:
        """Execute validation against an asset vulnerability with strict tenant isolation."""
        # 1. Fetch asset vulnerability with all related models
        stmt = (
            select(AssetVulnerability)
            .options(
                selectinload(AssetVulnerability.asset).selectinload(Asset.asset_software),
                selectinload(AssetVulnerability.vulnerability).selectinload(Vulnerability.vulnerability_cpes).selectinload(VulnerabilityCPE.cpe),
                selectinload(AssetVulnerability.software),
                selectinload(AssetVulnerability.validation),
            )
            .where(AssetVulnerability.id == asset_vulnerability_id)
        )
        res = await db.execute(stmt)
        av = res.scalar_one_or_none()
        if not av:
            raise NotFoundError(
                message=f"Asset vulnerability record '{asset_vulnerability_id}' was not found.",
                error_code="ASSET_VULN_NOT_FOUND",
            )

        # Verify tenant isolation
        if av.asset.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="You do not have access to assets outside your organization.",
                error_code="ORGANIZATION_ISOLATION_VIOLATION",
            )

        # 2. Gather all associated evidence (asset-wide and vulnerability-specific)
        ev_stmt = (
            select(Evidence)
            .where(
                Evidence.asset_id == av.asset_id,
                or_(
                    Evidence.asset_vulnerability_id == av.id,
                    Evidence.asset_vulnerability_id.is_(None),
                ),
            )
        )
        ev_res = await db.execute(ev_stmt)
        evidence_list = list(ev_res.scalars().all())

        # 3. Load effective rules
        rules = await validation_rule_service.get_effective_rules(
            db, organization_id=current_user.organization_id
        )

        # 4. Execute Validation Engine pipeline
        output: ValidationEngineOutput = ValidationEngine.evaluate(
            asset_vulnerability=av,
            evidence_list=evidence_list,
            rules=rules,
        )

        # 5. Retrieve or create VulnerabilityValidation
        val_query = select(VulnerabilityValidation).where(
            VulnerabilityValidation.asset_vulnerability_id == av.id
        )
        val_query_res = await db.execute(val_query)
        existing_val = val_query_res.scalar_one_or_none()

        previous_status = None
        previous_score = None
        previous_confidence = None

        if not existing_val:
            val_id = uuid.uuid4()
            validation = VulnerabilityValidation(
                id=val_id,
                asset_vulnerability_id=av.id,
                validation_status=output.validation_status,
                validation_score=output.validation_score,
                confidence=output.confidence,
                version_check=output.version_check,
                configuration_check=output.configuration_check,
                exposure_check=output.exposure_check,
                exploit_check=output.exploit_check,
                mitigation_check=output.mitigation_check,
                evidence_count=output.evidence_count,
                reasons=output.reasons,
                validated_at=datetime.now(timezone.utc),
                validated_by=current_user.id,
            )
            db.add(validation)
        else:
            validation = existing_val
            previous_status = validation.validation_status.value
            previous_score = validation.validation_score
            previous_confidence = validation.confidence

            validation.validation_status = output.validation_status
            validation.validation_score = output.validation_score
            validation.confidence = output.confidence
            validation.version_check = output.version_check
            validation.configuration_check = output.configuration_check
            validation.exposure_check = output.exposure_check
            validation.exploit_check = output.exploit_check
            validation.mitigation_check = output.mitigation_check
            validation.evidence_count = output.evidence_count
            validation.reasons = output.reasons
            validation.validated_at = datetime.now(timezone.utc)
            validation.validated_by = current_user.id

        # 6. Record history entry
        history_entry = ValidationHistory(
            id=uuid.uuid4(),
            validation_id=validation.id,
            previous_status=previous_status,
            new_status=output.validation_status.value,
            previous_score=previous_score,
            new_score=output.validation_score,
            previous_confidence=previous_confidence,
            new_confidence=output.confidence,
            changed_by=current_user.id,
            reason=reason_note or f"Automated engine validation completed with {output.evidence_count} evidence items.",
        )
        db.add(history_entry)

        # 7. Audit log
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.VALIDATION_RUN,
            resource_type="validation",
            resource_id=str(validation.id),
            metadata={
                "asset_vulnerability_id": str(av.id),
                "status": output.validation_status.value,
                "score": output.validation_score,
                "confidence": output.confidence,
            },
        )

        await db.commit()
        await db.refresh(validation)

        return validation

    @staticmethod
    async def rerun_validation(
        db: AsyncSession,
        validation_id: uuid.UUID,
        current_user: User,
    ) -> VulnerabilityValidation:
        """Re-evaluate an existing validation with fresh evidence."""
        val_res = await db.execute(
            select(VulnerabilityValidation).where(VulnerabilityValidation.id == validation_id)
        )
        validation = val_res.scalar_one_or_none()
        if not validation:
            raise NotFoundError(
                message=f"Validation '{validation_id}' was not found.",
                error_code="VALIDATION_NOT_FOUND",
            )

        return await ValidationService.run_validation(
            db=db,
            asset_vulnerability_id=validation.asset_vulnerability_id,
            current_user=current_user,
            reason_note="Revalidation triggered with updated evidence.",
        )

    @staticmethod
    async def get_validation_by_id(
        db: AsyncSession,
        validation_id: uuid.UUID,
        current_user: User,
    ) -> VulnerabilityValidation:
        """Fetch validation by ID enforcing organization ownership."""
        stmt = (
            select(VulnerabilityValidation)
            .options(
                selectinload(VulnerabilityValidation.asset_vulnerability).selectinload(AssetVulnerability.asset),
                selectinload(VulnerabilityValidation.asset_vulnerability).selectinload(AssetVulnerability.vulnerability),
                selectinload(VulnerabilityValidation.asset_vulnerability).selectinload(AssetVulnerability.software),
            )
            .where(VulnerabilityValidation.id == validation_id)
        )
        res = await db.execute(stmt)
        val = res.scalar_one_or_none()
        if not val:
            raise NotFoundError(
                message=f"Validation '{validation_id}' was not found.",
                error_code="VALIDATION_NOT_FOUND",
            )

        if val.asset_vulnerability.asset.organization_id != current_user.organization_id:
            raise AuthorizationError(
                message="Access denied to validation outside your organization.",
                error_code="ORGANIZATION_ISOLATION_VIOLATION",
            )

        return val

    @staticmethod
    async def get_detailed_validation(
        db: AsyncSession,
        validation_id: uuid.UUID,
        current_user: User,
    ) -> Dict[str, Any]:
        """Produce structured response satisfying Section 37 explainability schema."""
        val = await ValidationService.get_validation_by_id(db, validation_id, current_user)
        av = val.asset_vulnerability
        asset = av.asset
        vuln = av.vulnerability
        software = av.software

        # Fetch evidence items
        ev_stmt = (
            select(Evidence)
            .where(
                Evidence.asset_id == asset.id,
                or_(
                    Evidence.asset_vulnerability_id == av.id,
                    Evidence.asset_vulnerability_id.is_(None),
                ),
            )
        )
        ev_res = await db.execute(ev_stmt)
        evidence_records = list(ev_res.scalars().all())

        evidence_data = [
            {
                "type": e.evidence_type.value,
                "result": e.result.value,
                "source": e.source.value,
                "value": e.value,
                "confidence": e.confidence,
            }
            for e in evidence_records
        ]

        software_data = None
        if software:
            software_data = {
                "name": software.product_name,
                "version": software.product_version,
                "vendor": software.vendor,
            }

        return {
            "asset": {
                "id": str(asset.id),
                "name": asset.name,
                "criticality": asset.criticality.value if asset.criticality else "MEDIUM",
                "internet_exposed": asset.internet_exposed,
            },
            "software": software_data,
            "vulnerability": {
                "cve_id": vuln.cve_id,
                "cvss_score": vuln.cvss_score,
                "severity": vuln.severity.value if vuln.severity else "NONE",
            },
            "validation": {
                "id": str(val.id),
                "status": val.validation_status.value,
                "score": val.validation_score,
                "confidence": val.confidence,
            },
            "evidence": evidence_data,
            "reasons": val.reasons or [],
        }

    @staticmethod
    async def run_bulk_validation(
        db: AsyncSession,
        current_user: User,
        asset_ids: Optional[List[uuid.UUID]] = None,
        organization_id: Optional[uuid.UUID] = None,
    ) -> Tuple[int, uuid.UUID]:
        """Execute validation across multiple assets within the user's organization."""
        target_org_id = current_user.organization_id
        if organization_id and current_user.role == UserRole.ADMIN:
            target_org_id = organization_id

        # Query all AssetVulnerability records for target scope
        stmt = (
            select(AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .where(Asset.organization_id == target_org_id)
        )
        if asset_ids:
            stmt = stmt.where(AssetVulnerability.asset_id.in_(asset_ids))

        res = await db.execute(stmt)
        vuln_ids = list(res.scalars().all())

        job_id = uuid.uuid4()
        # Execute each validation sequentially within transaction or batch
        processed_count = 0
        for av_id in vuln_ids:
            try:
                await ValidationService.run_validation(
                    db=db,
                    asset_vulnerability_id=av_id,
                    current_user=current_user,
                    reason_note=f"Bulk validation run (Job: {job_id})",
                )
                processed_count += 1
            except Exception:
                continue

        return processed_count, job_id

    @staticmethod
    async def get_statistics(
        db: AsyncSession,
        current_user: User,
    ) -> Dict[str, int]:
        """Aggregate validation statistics for the current user's organization."""
        org_id = current_user.organization_id

        # Query joins
        stmt = (
            select(
                VulnerabilityValidation.validation_status,
                VulnerabilityValidation.confidence,
                Vulnerability.cvss_score,
            )
            .join(AssetVulnerability, VulnerabilityValidation.asset_vulnerability_id == AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .join(Vulnerability, AssetVulnerability.vulnerability_id == Vulnerability.id)
            .where(Asset.organization_id == org_id)
        )
        res = await db.execute(stmt)
        rows = res.all()

        stats = {
            "total": len(rows),
            "confirmed": 0,
            "likely_vulnerable": 0,
            "unknown": 0,
            "likely_not_vulnerable": 0,
            "false_positive": 0,
            "high_confidence_findings": 0,
            "unknown_findings": 0,
            "needs_manual_review": 0,
        }

        for status, conf, cvss in rows:
            stat_val = status.value if hasattr(status, "value") else str(status)
            if stat_val == "CONFIRMED":
                stats["confirmed"] += 1
            elif stat_val == "LIKELY_VULNERABLE":
                stats["likely_vulnerable"] += 1
            elif stat_val == "UNKNOWN":
                stats["unknown"] += 1
                stats["unknown_findings"] += 1
            elif stat_val == "LIKELY_NOT_VULNERABLE":
                stats["likely_not_vulnerable"] += 1
            elif stat_val == "FALSE_POSITIVE":
                stats["false_positive"] += 1

            if conf >= 0.80:
                stats["high_confidence_findings"] += 1

            # Analyst review conditions:
            # - Unknown status
            # - Low confidence (< 0.60)
            # - Critical CVSS (>= 9.0) that is not definitively confirmed
            if (
                stat_val == "UNKNOWN"
                or conf < 0.60
                or (cvss and cvss >= 9.0 and stat_val != "CONFIRMED")
            ):
                stats["needs_manual_review"] += 1

        return stats

    @staticmethod
    async def get_review_queue(
        db: AsyncSession,
        current_user: User,
        limit: int = 50,
        offset: int = 0,
    ) -> List[VulnerabilityValidation]:
        """Fetch items needing human analyst attention."""
        org_id = current_user.organization_id

        stmt = (
            select(VulnerabilityValidation)
            .join(AssetVulnerability, VulnerabilityValidation.asset_vulnerability_id == AssetVulnerability.id)
            .join(Asset, AssetVulnerability.asset_id == Asset.id)
            .join(Vulnerability, AssetVulnerability.vulnerability_id == Vulnerability.id)
            .where(
                Asset.organization_id == org_id,
                or_(
                    VulnerabilityValidation.validation_status == ValidationStatus.UNKNOWN,
                    VulnerabilityValidation.confidence < 0.60,
                    and_(
                        Vulnerability.cvss_score >= 9.0,
                        VulnerabilityValidation.validation_status != ValidationStatus.CONFIRMED,
                    ),
                ),
            )
            .order_by(Vulnerability.cvss_score.desc().nulls_last())
            .offset(offset)
            .limit(limit)
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())


validation_service = ValidationService()
