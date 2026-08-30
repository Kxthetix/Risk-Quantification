"""Background worker for asynchronous Monte Carlo simulations (Phase 6)."""
import asyncio
import logging
from typing import Any, Dict, Optional
import uuid

from app.core.database import async_session_factory
from app.models.enums import SimulationStatus
from app.models.user import User
from app.services.financial_service import financial_service
from app.services.simulation_service import simulation_service

logger = logging.getLogger(__name__)


async def _run_simulation_async(
    job_id: uuid.UUID,
    asset_vulnerability_id: uuid.UUID,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    simulation_count: int = 10000,
    random_seed: int = 42,
    overrides: Optional[Dict[str, Any]] = None,
) -> None:
    """Worker task executing Monte Carlo simulation in an isolated database session."""
    try:
        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.error(f"[SimulationWorker] User {user_id} not found.")
                return

            # Set status to PROCESSING
            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.PROCESSING,
                progress=15,
                completed=int(simulation_count * 0.15),
            )

            # Perform calculation
            assessment = await financial_service.calculate_financial_impact(
                db=db,
                asset_vulnerability_id=asset_vulnerability_id,
                current_user=user,
                simulation_count=simulation_count,
                random_seed=random_seed,
                overrides=overrides,
            )

            # Mark COMPLETED
            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.COMPLETED,
                progress=100,
                completed=simulation_count,
                financial_assessment_id=assessment.id,
            )
            logger.info(f"[SimulationWorker] Completed job {job_id} for assessment {assessment.id}")
    except Exception as e:
        logger.exception(f"[SimulationWorker] Simulation job {job_id} failed: {e}")
        try:
            async with async_session_factory() as db:
                await simulation_service.update_progress(
                    db=db,
                    job_id=job_id,
                    status=SimulationStatus.FAILED,
                    progress=0,
                    completed=0,
                    error_message=str(e),
                )
        except Exception as inner_e:
            logger.error(f"[SimulationWorker] Failed to update error status for {job_id}: {inner_e}")


def dispatch_simulation_task(
    job_id: uuid.UUID,
    asset_vulnerability_id: uuid.UUID,
    current_user: User,
    simulation_count: int = 10000,
    random_seed: int = 42,
    overrides: Optional[Dict[str, Any]] = None,
) -> None:
    """Dispatch non-blocking Monte Carlo simulation task."""
    asyncio.create_task(
        _run_simulation_async(
            job_id=job_id,
            asset_vulnerability_id=asset_vulnerability_id,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            simulation_count=simulation_count,
            random_seed=random_seed,
            overrides=overrides,
        )
    )
