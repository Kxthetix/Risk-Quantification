"""FastAPI Router for SOAR Approvals & High-Risk Safeguards (Phase 10)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.approval import (
    ApprovalItem,
    ApprovalDetailResponse,
    ApprovalActionRequest,
)
from app.services.approval_service import ApprovalService

router = APIRouter(prefix="/approvals", tags=["SOAR Approvals & Safeguards"])


@router.get("/", response_model=List[ApprovalItem])
async def get_approvals(
    status_filter: Optional[str] = Query(None, alias="status", description="PENDING, APPROVED, REJECTED, EXPIRED"),
    current_user: User = Depends(get_current_user),
) -> List[ApprovalItem]:
    """List pending and historical approval requests."""
    return ApprovalService.get_approvals(str(current_user.organization_id), status=status_filter)


@router.get("/{approval_id}", response_model=ApprovalDetailResponse)
async def get_approval(
    approval_id: str,
    current_user: User = Depends(get_current_user),
) -> ApprovalDetailResponse:
    """Retrieve detailed approval context, projected financial impact, and asset risks."""
    try:
        return ApprovalService.get_approval(str(current_user.organization_id), approval_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{approval_id}/action", response_model=ApprovalDetailResponse)
async def process_approval_action(
    approval_id: str,
    payload: ApprovalActionRequest,
    current_user: User = Depends(get_current_user),
) -> ApprovalDetailResponse:
    """Approve or reject a high-risk SOAR containment action with explicit confirmation."""
    if payload.decision == "APPROVE" and not payload.confirmed_destructive_risk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit confirmation of destructive risk is required to approve this action."
        )

    try:
        return ApprovalService.process_decision(
            organization_id=str(current_user.organization_id),
            approval_id=approval_id,
            request=payload,
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
