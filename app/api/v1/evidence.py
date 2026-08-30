"""Evidence Collection and Management API Endpoints."""
from typing import List
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.user import User, UserRole
from app.schemas.evidence import EvidenceCreate, EvidenceListResponse, EvidenceResponse
from app.services.evidence_service import evidence_service

router = APIRouter(tags=["Evidence Engine"])


def _require_analyst_or_admin(current_user: User) -> None:
    if not current_user.role.has_permission(UserRole.SECURITY_ANALYST):
        raise AuthorizationError(
            message="This action requires SECURITY_ANALYST role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


@router.post(
    "/assets/{asset_id}/vulnerabilities/{cve_id}/evidence",
    response_model=EvidenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Validation Evidence",
    description="Submit empirical, configuration, network, or mitigation evidence for an asset vulnerability finding.",
)
async def add_evidence(
    asset_id: uuid.UUID,
    cve_id: str,
    payload: EvidenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EvidenceResponse:
    _require_analyst_or_admin(current_user)
    evidence = await evidence_service.add_evidence_for_cve(
        db=db,
        asset_id=asset_id,
        cve_id=cve_id,
        payload=payload,
        current_user=current_user,
    )
    return EvidenceResponse.model_validate(evidence)


@router.get(
    "/assets/{asset_id}/vulnerabilities/{cve_id}/evidence",
    response_model=EvidenceListResponse,
    summary="List Evidence for Asset Vulnerability",
    description="Retrieve all empirical evidence associated with a specific asset vulnerability within the organization.",
)
async def get_evidence(
    asset_id: uuid.UUID,
    cve_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EvidenceListResponse:
    items = await evidence_service.get_evidence_for_cve(
        db=db,
        asset_id=asset_id,
        cve_id=cve_id,
        current_user=current_user,
    )
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(item) for item in items],
        total=len(items),
    )


@router.delete(
    "/evidence/{evidence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Validation Evidence",
    description="Remove an evidence item belonging to an asset within your organization.",
)
async def delete_evidence(
    evidence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    _require_analyst_or_admin(current_user)
    await evidence_service.delete_evidence(
        db=db,
        evidence_id=evidence_id,
        current_user=current_user,
    )
