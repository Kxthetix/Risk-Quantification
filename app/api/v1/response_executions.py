"""FastAPI Router for SOAR Execution Traces, Retries and Rollbacks (Phase 10)."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.playbook import (
    PlaybookExecutionResponse,
    PlaybookRetryRequest,
    PlaybookRollbackRequest,
)
from app.services.playbook_service import PlaybookService

router = APIRouter(prefix="/response-executions", tags=["SOAR Response Executions"])


@router.get("/", response_model=List[PlaybookExecutionResponse])
async def get_response_executions(
    current_user: User = Depends(get_current_user),
) -> List[PlaybookExecutionResponse]:
    """Retrieve history of active and completed playbook executions."""
    return PlaybookService.get_executions(str(current_user.organization_id))


@router.get("/{execution_id}", response_model=PlaybookExecutionResponse)
async def get_response_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
) -> PlaybookExecutionResponse:
    """Retrieve deep execution trace and step-by-step progress."""
    try:
        return PlaybookService.get_execution(str(current_user.organization_id), execution_id)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{execution_id}/retry", response_model=PlaybookExecutionResponse)
async def retry_execution_step(
    execution_id: str,
    payload: PlaybookRetryRequest,
    current_user: User = Depends(get_current_user),
) -> PlaybookExecutionResponse:
    """Retry a failed or halted execution step with state verification."""
    try:
        return PlaybookService.retry_step(str(current_user.organization_id), execution_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{execution_id}/rollback", response_model=PlaybookExecutionResponse)
async def rollback_execution(
    execution_id: str,
    payload: PlaybookRollbackRequest,
    current_user: User = Depends(get_current_user),
) -> PlaybookExecutionResponse:
    """Roll back executed actions and restore infrastructure state."""
    try:
        return PlaybookService.rollback_execution(str(current_user.organization_id), execution_id, payload)
    except KeyError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
