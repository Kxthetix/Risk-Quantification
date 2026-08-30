"""Background worker for asynchronous cyber risk calculations (Phase 5)."""
import asyncio
import logging
from typing import List, Optional
import uuid

from app.core.database import async_session_factory
from app.models.user import User
from app.services.risk_service import risk_service

logger = logging.getLogger(__name__)


async def _run_risk_async(
    asset_vulnerability_id: uuid.UUID,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    reason: Optional[str] = None,
) -> None:
    """Worker task executing single risk calculation in a fresh database session."""
    try:
        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.error(f"[RiskWorker] User {user_id} not found.")
                return

            await risk_service.calculate_risk_for_vulnerability(
                db=db,
                asset_vulnerability_id=asset_vulnerability_id,
                current_user=user,
                reason=reason or "Asynchronous background risk calculation",
            )
            logger.info(f"[RiskWorker] Risk calculated for AV {asset_vulnerability_id}")
    except Exception as e:
        logger.exception(f"[RiskWorker] Failed risk calculation for AV {asset_vulnerability_id}: {e}")


async def _run_bulk_risk_async(
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
    asset_ids: Optional[List[uuid.UUID]] = None,
    all_organization_assets: bool = False,
) -> None:
    """Worker task executing bulk risk calculations across assets."""
    try:
        async with async_session_factory() as db:
            user = await db.get(User, user_id)
            if not user:
                logger.error(f"[RiskWorker] User {user_id} not found.")
                return

            count = await risk_service.calculate_bulk_risk(
                db=db,
                current_user=user,
                asset_ids=asset_ids,
                all_organization_assets=all_organization_assets,
            )
            logger.info(f"[RiskWorker] Completed bulk risk calculation for {count} vulnerabilities")
    except Exception as e:
        logger.exception(f"[RiskWorker] Bulk risk calculation failed: {e}")


def dispatch_risk_task(
    asset_vulnerability_id: uuid.UUID,
    current_user: User,
    reason: Optional[str] = None,
) -> None:
    """Dispatch non-blocking single risk calculation task."""
    asyncio.create_task(
        _run_risk_async(
            asset_vulnerability_id=asset_vulnerability_id,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            reason=reason,
        )
    )


def dispatch_bulk_risk_task(
    current_user: User,
    asset_ids: Optional[List[uuid.UUID]] = None,
    all_organization_assets: bool = False,
) -> None:
    """Dispatch non-blocking bulk risk calculation task."""
    asyncio.create_task(
        _run_bulk_risk_async(
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            asset_ids=asset_ids,
            all_organization_assets=all_organization_assets,
        )
    )
