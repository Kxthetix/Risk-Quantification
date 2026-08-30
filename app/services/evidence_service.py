"""Evidence service handling ingestion, retrieval, and audit logging of validation evidence."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthorizationError, BadRequestError, NotFoundError
from app.models.asset import Asset
from app.models.asset_vulnerability import AssetVulnerability
from app.models.enums import AuditAction
from app.models.evidence import Evidence
from app.models.user import User
from app.models.vulnerability import Vulnerability
from app.schemas.evidence import EvidenceCreate
from app.services.audit_service import audit_service


class EvidenceService:
    """Service providing multi-tenant evidence management with strict organization isolation."""

    @staticmethod
    async def add_evidence_for_cve(
        db: AsyncSession,
        asset_id: uuid.UUID,
        cve_id: str,
        payload: EvidenceCreate,
        current_user: User,
    ) -> Evidence:
        """Record a new piece of evidence for a specific asset vulnerability.

        Enforces organization isolation by validating that the asset belongs
        to current_user.organization_id.
        """
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
                message=f"Asset '{asset_id}' not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        # 2. Look up vulnerability by cve_id
        vuln_res = await db.execute(
            select(Vulnerability).where(Vulnerability.cve_id == cve_id.strip())
        )
        vuln = vuln_res.scalar_one_or_none()
        if not vuln:
            raise NotFoundError(
                message=f"Vulnerability '{cve_id}' was not found.",
                error_code="VULNERABILITY_NOT_FOUND",
            )

        # 3. Look up asset_vulnerability link
        av_res = await db.execute(
            select(AssetVulnerability).where(
                AssetVulnerability.asset_id == asset_id,
                AssetVulnerability.vulnerability_id == vuln.id,
            )
        )
        asset_vuln = av_res.scalar_one_or_none()
        # asset_vulnerability may be present or nullable if evidence is asset-wide

        # 4. Input sanitation and size checks
        val = payload.value.strip()
        if not val:
            raise BadRequestError(
                message="Evidence value cannot be empty.",
                error_code="INVALID_EVIDENCE_VALUE",
            )
        if len(val) > 10000:
            raise BadRequestError(
                message="Evidence value exceeds maximum permitted size (10000 characters).",
                error_code="EVIDENCE_VALUE_TOO_LARGE",
            )

        # 5. Create Evidence record
        evidence = Evidence(
            id=uuid.uuid4(),
            asset_id=asset.id,
            asset_vulnerability_id=asset_vuln.id if asset_vuln else None,
            evidence_type=payload.evidence_type,
            source=payload.source,
            value=val,
            result=payload.result,
            confidence=payload.confidence,
            collected_at=datetime.now(timezone.utc),
            collected_by=current_user.id,
            extra_metadata=payload.metadata,
        )
        db.add(evidence)

        # 6. Audit Trail
        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.EVIDENCE_CREATED,
            resource_type="evidence",
            resource_id=str(evidence.id),
            metadata={
                "asset_id": str(asset.id),
                "cve_id": cve_id,
                "evidence_type": payload.evidence_type.value,
                "source": payload.source.value,
                "result": payload.result.value,
                "confidence": payload.confidence,
            },
        )

        await db.commit()
        await db.refresh(evidence)

        return evidence

    @staticmethod
    async def get_evidence_for_cve(
        db: AsyncSession,
        asset_id: uuid.UUID,
        cve_id: str,
        current_user: User,
    ) -> List[Evidence]:
        """Retrieve all evidence associated with an asset vulnerability within the user's organization."""
        # Verify asset ownership
        asset_res = await db.execute(
            select(Asset).where(
                Asset.id == asset_id,
                Asset.organization_id == current_user.organization_id,
            )
        )
        asset = asset_res.scalar_one_or_none()
        if not asset:
            raise NotFoundError(
                message=f"Asset '{asset_id}' not found in your organization.",
                error_code="ASSET_NOT_FOUND",
            )

        # Look up vulnerability
        vuln_res = await db.execute(
            select(Vulnerability).where(Vulnerability.cve_id == cve_id.strip())
        )
        vuln = vuln_res.scalar_one_or_none()
        if not vuln:
            raise NotFoundError(
                message=f"Vulnerability '{cve_id}' was not found.",
                error_code="VULNERABILITY_NOT_FOUND",
            )

        av_res = await db.execute(
            select(AssetVulnerability).where(
                AssetVulnerability.asset_id == asset_id,
                AssetVulnerability.vulnerability_id == vuln.id,
            )
        )
        asset_vuln = av_res.scalar_one_or_none()

        # Query evidence matching asset and optional asset_vulnerability
        query = select(Evidence).where(Evidence.asset_id == asset.id)
        if asset_vuln:
            query = query.where(
                (Evidence.asset_vulnerability_id == asset_vuln.id)
                | (Evidence.asset_vulnerability_id.is_(None))
            )
        else:
            query = query.where(Evidence.asset_vulnerability_id.is_(None))

        query = query.order_by(Evidence.collected_at.desc())
        res = await db.execute(query)
        return list(res.scalars().all())

    @staticmethod
    async def delete_evidence(
        db: AsyncSession,
        evidence_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Delete an evidence record, verifying tenant isolation through asset ownership."""
        ev_res = await db.execute(
            select(Evidence).where(Evidence.id == evidence_id)
        )
        evidence = ev_res.scalar_one_or_none()
        if not evidence:
            raise NotFoundError(
                message=f"Evidence '{evidence_id}' was not found.",
                error_code="EVIDENCE_NOT_FOUND",
            )

        # Verify asset ownership
        asset_res = await db.execute(
            select(Asset).where(
                Asset.id == evidence.asset_id,
                Asset.organization_id == current_user.organization_id,
            )
        )
        asset = asset_res.scalar_one_or_none()
        if not asset:
            raise AuthorizationError(
                message="You are not authorized to delete evidence for this asset.",
                error_code="FORBIDDEN_EVIDENCE_ACCESS",
            )

        await audit_service.log(
            db,
            user=current_user,
            action=AuditAction.EVIDENCE_DELETED,
            resource_type="evidence",
            resource_id=str(evidence_id),
            metadata={
                "asset_id": str(evidence.asset_id),
                "deleted_by": str(current_user.id),
            },
        )

        await db.delete(evidence)
        await db.commit()


evidence_service = EvidenceService()
