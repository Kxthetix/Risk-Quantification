"""Background worker for asynchronous Attack Path Analysis (Phase 7)."""
import asyncio
import logging
from typing import Optional
import uuid

from app.core.database import async_session_factory
from app.models.enums import SimulationStatus
from app.models.user import User
from app.services.attack_path_service import attack_path_service
from app.services.simulation_service import simulation_service

logger = logging.getLogger(__name__)


async def _run_attack_path_async(
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    target_asset_id: Optional[uuid.UUID] = None,
    max_path_length: int = 8,
    max_paths: int = 100,
) -> None:
    """Worker task executing graph discovery in an isolated database session."""
    try:
        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.error(f"[AttackPathWorker] User {user_id} not found.")
                return

            # Set status to PROCESSING
            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.PROCESSING,
                progress=25,
                completed=0,
            )

            # Perform path discovery
            paths = await attack_path_service.analyze_attack_paths(
                db=db,
                organization_id=organization_id,
                current_user=user,
                target_asset_id=target_asset_id,
                max_path_length=max_path_length,
                max_paths=max_paths,
            )

            # Mark COMPLETED
            await simulation_service.update_progress(
                db=db,
                job_id=job_id,
                status=SimulationStatus.COMPLETED,
                progress=100,
                completed=len(paths),
            )
            logger.info(f"[AttackPathWorker] Completed job {job_id} discovered {len(paths)} paths.")
    except Exception as e:
        logger.exception(f"[AttackPathWorker] Attack path job {job_id} failed: {e}")
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
            logger.error(f"[AttackPathWorker] Failed to update error status for {job_id}: {inner_e}")


def dispatch_attack_path_task(
    job_id: uuid.UUID,
    current_user: User,
    target_asset_id: Optional[uuid.UUID] = None,
    max_path_length: int = 8,
    max_paths: int = 100,
) -> None:
    """Dispatch non-blocking attack path analysis task."""
    asyncio.create_task(
        _run_attack_path_async(
            job_id=job_id,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            target_asset_id=target_asset_id,
            max_path_length=max_path_length,
            max_paths=max_paths,
        )
    )
