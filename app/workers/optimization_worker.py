"""Background worker for asynchronous cybersecurity portfolio optimization (Phase 8)."""
import asyncio
import logging
from typing import Optional
import uuid

from app.core.database import async_session_factory
from app.models.enums import OptimizationAlgorithm, SimulationStatus
from app.models.user import User
from app.services.optimization_service import optimization_service
from app.services.simulation_service import simulation_service

logger = logging.getLogger(__name__)


async def _run_optimization_async(
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    budget: float,
    algorithm: OptimizationAlgorithm = OptimizationAlgorithm.KNAPSACK,
    scenario_id: Optional[uuid.UUID] = None,
    horizon_years: int = 1,
) -> None:
    """Worker task executing portfolio optimization in an isolated database session."""
    try:
        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.error(f"[OptimizationWorker] User {user_id} not found.")
                return

            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.PROCESSING,
                progress=30,
                completed=0,
            )

            res = await optimization_service.run_optimization(
                db=db,
                organization_id=organization_id,
                budget=budget,
                algorithm=algorithm,
                scenario_id=scenario_id,
                horizon_years=horizon_years,
                current_user=user,
            )

            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.COMPLETED,
                progress=100,
                completed=len(res.selected_actions),
            )
            logger.info(f"[OptimizationWorker] Completed job {job_id} selected {len(res.selected_actions)} actions.")
    except Exception as e:
        logger.error(f"[OptimizationWorker] Failed job {job_id}: {str(e)}", exc_info=True)
        try:
            async with async_session_factory() as err_db:
                await simulation_service.update_progress(
                    db=err_db,
                    job_id=job_id,
                    status=SimulationStatus.FAILED,
                    progress=0,
                    completed=0,
                    error_message=str(e),
                )
        except Exception as inner_err:
            logger.error(f"[OptimizationWorker] Could not record failure: {inner_err}")


def launch_optimization_task(
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    budget: float,
    algorithm: OptimizationAlgorithm = OptimizationAlgorithm.KNAPSACK,
    scenario_id: Optional[uuid.UUID] = None,
    horizon_years: int = 1,
) -> None:
    """Non-blocking helper to launch background optimization task."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            _run_optimization_async(
                job_id=job_id,
                user_id=user_id,
                organization_id=organization_id,
                budget=budget,
                algorithm=algorithm,
                scenario_id=scenario_id,
                horizon_years=horizon_years,
            )
        )
    except RuntimeError:
        asyncio.run(
            _run_optimization_async(
                job_id=job_id,
                user_id=user_id,
                organization_id=organization_id,
                budget=budget,
                algorithm=algorithm,
                scenario_id=scenario_id,
                horizon_years=horizon_years,
            )
        )
