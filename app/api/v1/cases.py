"""FastAPI Router for Major Incident Case Management (Phase 10)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.case_management import (
    CaseItem,
    CaseDetailResponse,
    CaseCreateRequest,
    CaseUpdateRequest,
)
from app.services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["Major Incident Case Management"])


@router.get("/", response_model=List[CaseItem])
async def get_cases(
    status_filter: Optional[str] = Query(None, alias="status", description="OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED"),
    current_user: User = Depends(get_current_user),
) -> List[CaseItem]:
    """Retrieve consolidated major incident cases."""
    return CaseService.get_cases(str(current_user.organization_id), status=status_filter)


@router.get("/{case_id}", response_model=CaseDetailResponse)
async def get_case(
    case_id: str,
    current_user: User = Depends(get_current_user),
) -> CaseDetailResponse:
    """Retrieve deep case workspace, linked incidents, evidence, and response timeline."""
    try:
        return CaseService.get_case(str(current_user.organization_id), case_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/", response_model=CaseDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_case(
    payload: CaseCreateRequest,
    current_user: User = Depends(get_current_user),
) -> CaseDetailResponse:
    """Create a new consolidated major incident case."""
    return CaseService.create_case(str(current_user.organization_id), payload)


@router.put("/{case_id}", response_model=CaseDetailResponse)
async def update_case(
    case_id: str,
    payload: CaseUpdateRequest,
    current_user: User = Depends(get_current_user),
) -> CaseDetailResponse:
    """Update case status, lead investigator, or scope."""
    try:
        return CaseService.update_case(str(current_user.organization_id), case_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
