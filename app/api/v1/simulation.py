"""Simulation job polling API endpoints (Phase 6)."""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.simulation import SimulationJobResponse
from app.services.simulation_service import simulation_service

router = APIRouter(tags=["Monte Carlo Simulations"])


@router.get(
    "/simulation/{job_id}",
    response_model=SimulationJobResponse,
    summary="Get Monte Carlo Simulation Job Status",
)
async def get_simulation_status(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SimulationJobResponse:
    """Check asynchronous simulation execution progress, completed iterations, and state."""
    job = await simulation_service.get_job(
        db=db,
        job_id=job_id,
        organization_id=current_user.organization_id,
    )
    return SimulationJobResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        simulations_completed=job.simulations_completed,
        total_simulations=job.total_simulations,
        error_message=job.error_message,
        created_at=job.created_at,
    )
