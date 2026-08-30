"""Simulation job tracking and progress service (Phase 6)."""
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.enums import AuditAction, SimulationStatus
from app.models.simulation import SimulationJob
from app.services.audit_service import audit_service


class SimulationService:
    """Manages asynchronous simulation jobs and lifecycle tracking."""

    async def create_job(
        self,
        db: AsyncSession,
        organization_id: uuid.UUID,
        total_simulations: int = 10000,
        financial_assessment_id: Optional[uuid.UUID] = None,
    ) -> SimulationJob:
        """Create a new queued simulation job."""
        job = SimulationJob(
            organization_id=organization_id,
            financial_assessment_id=financial_assessment_id,
            status=SimulationStatus.QUEUED,
            progress=0,
            simulations_completed=0,
            total_simulations=total_simulations,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    async def get_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        organization_id: uuid.UUID,
    ) -> SimulationJob:
        """Retrieve simulation job status ensuring tenant isolation."""
        stmt = select(SimulationJob).where(
            SimulationJob.id == job_id,
            SimulationJob.organization_id == organization_id,
        )
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()
        if not job:
            raise NotFoundError(
                message=f"Simulation job {job_id} not found.",
                error_code="SIMULATION_JOB_NOT_FOUND",
            )
        return job

    async def update_progress(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        status: SimulationStatus,
        progress: int,
        completed: int,
        financial_assessment_id: Optional[uuid.UUID] = None,
        error_message: Optional[str] = None,
    ) -> SimulationJob:
        """Update the progress of a running or completed simulation."""
        stmt = select(SimulationJob).where(SimulationJob.id == job_id)
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()
        if not job:
            return None

        job.status = status
        job.progress = max(0, min(100, progress))
        job.simulations_completed = completed
        if financial_assessment_id:
            job.financial_assessment_id = financial_assessment_id
        if error_message:
            job.error_message = error_message

        await db.commit()
        await db.refresh(job)
        return job


simulation_service = SimulationService()
