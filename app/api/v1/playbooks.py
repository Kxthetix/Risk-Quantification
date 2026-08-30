"""FastAPI Router for SOAR Playbooks Catalog, Workflow Builder & Execution (Phase 10)."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.playbook import (
    PlaybookItem,
    PlaybookDetailResponse,
    PlaybookCreateRequest,
    PlaybookExecutionRequest,
    PlaybookExecutionResponse,
)
from app.services.playbook_service import PlaybookService

router = APIRouter(prefix="/playbooks", tags=["SOAR Response Playbooks"])


@router.get("/", response_model=List[PlaybookItem])
async def get_playbooks(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: User = Depends(get_current_user),
) -> List[PlaybookItem]:
    """List all SOAR playbooks across categories."""
    return PlaybookService.get_playbooks(str(current_user.organization_id), category=category)


@router.get("/{playbook_id}", response_model=PlaybookDetailResponse)
async def get_playbook(
    playbook_id: str,
    current_user: User = Depends(get_current_user),
) -> PlaybookDetailResponse:
    """Retrieve playbook configuration, conditions, steps, and permissions."""
    try:
        return PlaybookService.get_playbook(str(current_user.organization_id), playbook_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/", response_model=PlaybookDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_playbook(
    payload: PlaybookCreateRequest,
    current_user: User = Depends(get_current_user),
) -> PlaybookDetailResponse:
    """Create a new SOAR response playbook definition."""
    return PlaybookService.create_playbook(str(current_user.organization_id), payload)


@router.post("/{playbook_id}/execute", response_model=PlaybookExecutionResponse)
async def execute_playbook(
    playbook_id: str,
    payload: PlaybookExecutionRequest,
    current_user: User = Depends(get_current_user),
) -> PlaybookExecutionResponse:
    """Execute a SOAR playbook in live mode or dry-run simulation mode."""
    try:
        return PlaybookService.execute_playbook(
            organization_id=str(current_user.organization_id),
            playbook_id=playbook_id,
            request=payload,
            started_by=current_user.name if hasattr(current_user, "name") else "SOC Commander",
        )
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
