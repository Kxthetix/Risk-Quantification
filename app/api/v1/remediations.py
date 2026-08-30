"""Remediation API endpoints (Phase 8)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import RemediationPriorityLevel, RemediationStatus
from app.models.user import User, UserRole
from app.schemas.remediation import (
    RemediationCreate,
    RemediationListResponse,
    RemediationResponse,
    RemediationSimulateResponse,
    RemediationUpdate,
    RemediationVerifyRequest,
    RiskAcceptanceRequest,
    TopRemediationsResponse,
)
from app.services.remediation_service import remediation_service

router = APIRouter(prefix="/remediations", tags=["Remediations"])


@router.post(
    "",
    response_model=RemediationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a remediation action",
)
async def create_remediation(
    payload: RemediationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Create and contextually prioritize a new vulnerability remediation action."""
    rem = await remediation_service.create_remediation(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return RemediationResponse.model_validate(rem)


@router.get(
    "",
    response_model=RemediationListResponse,
    summary="List remediations",
)
async def list_remediations(
    status_filter: Optional[RemediationStatus] = Query(None, alias="status"),
    priority_level: Optional[RemediationPriorityLevel] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationListResponse:
    """List remediations for the authenticated tenant with optional filters."""
    rems = await remediation_service.get_remediations(
        db=db,
        organization_id=current_user.organization_id,
        status=status_filter,
        priority_level=priority_level,
        limit=limit,
        offset=offset,
    )
    return RemediationListResponse(
        remediations=[RemediationResponse.model_validate(r) for r in rems],
        total=len(rems),
    )


@router.get(
    "/top",
    response_model=TopRemediationsResponse,
    summary="Get top prioritized remediation recommendations",
)
async def get_top_remediations(
    limit: int = Query(10, ge=1, le=50),
    priority_level: Optional[RemediationPriorityLevel] = Query(None),
    asset_id: Optional[uuid.UUID] = Query(None),
    max_cost: Optional[float] = Query(None, ge=0.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TopRemediationsResponse:
    """Fetch top priority remediations ranked by risk, financial loss, path leverage, and ROI."""
    return await remediation_service.get_top_remediations(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
        priority_level=priority_level,
        asset_id=asset_id,
        max_cost=max_cost,
    )


@router.get(
    "/{remediation_id}",
    response_model=RemediationResponse,
    summary="Get a single remediation",
)
async def get_remediation(
    remediation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Fetch remediation details by ID."""
    rem = await remediation_service.get_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
    )
    return RemediationResponse.model_validate(rem)


@router.put(
    "/{remediation_id}",
    response_model=RemediationResponse,
    summary="Update remediation details",
)
async def update_remediation(
    remediation_id: uuid.UUID,
    payload: RemediationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Update properties of an existing remediation."""
    rem = await remediation_service.update_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
        payload=payload,
        current_user=current_user,
    )
    return RemediationResponse.model_validate(rem)


@router.delete(
    "/{remediation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a remediation",
)
async def delete_remediation(
    remediation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a remediation action."""
    await remediation_service.delete_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
        current_user=current_user,
    )


@router.post(
    "/{remediation_id}/simulate",
    response_model=RemediationSimulateResponse,
    summary="Simulate remediation impact",
)
async def simulate_remediation(
    remediation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationSimulateResponse:
    """Simulate pre- and post-remediation risk reduction, expected loss reduction, ROI, and TCO."""
    return await remediation_service.simulate_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
    )


@router.post(
    "/{remediation_id}/complete",
    response_model=RemediationResponse,
    summary="Mark remediation completed",
)
async def complete_remediation(
    remediation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Mark a remediation action completed (awaiting empirical verification)."""
    rem = await remediation_service.complete_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
        current_user=current_user,
    )
    return RemediationResponse.model_validate(rem)


@router.post(
    "/{remediation_id}/verify",
    response_model=RemediationResponse,
    summary="Verify remediation with empirical evidence",
)
async def verify_remediation(
    remediation_id: uuid.UUID,
    payload: RemediationVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Verify remediation with empirical proof, close the linked finding, and recalculate risk."""
    rem = await remediation_service.verify_remediation(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
        payload=payload,
        current_user=current_user,
    )
    return RemediationResponse.model_validate(rem)


@router.post(
    "/{remediation_id}/accept-risk",
    response_model=RemediationResponse,
    summary="Formally accept risk",
)
async def accept_risk(
    remediation_id: uuid.UUID,
    payload: RiskAcceptanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RemediationResponse:
    """Accept risk for a finding with mandatory justification, executive approval, and expiration."""
    rem = await remediation_service.accept_risk(
        db=db,
        organization_id=current_user.organization_id,
        remediation_id=remediation_id,
        payload=payload,
        current_user=current_user,
    )
    return RemediationResponse.model_validate(rem)
