"""Background worker for daily risk & financial posture snapshots (Phase 9)."""
import asyncio
import logging
import uuid
from typing import List

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models.organization import Organization
from app.services.trend_service import TrendService

logger = logging.getLogger(__name__)


async def run_daily_dashboard_snapshots() -> None:
    """Capture daily risk and financial snapshots for all active organizations."""
    async with async_session_factory() as session:
        try:
            logger.info("Executing daily organizational risk snapshots...")
            stmt = select(Organization.id)
            res = await session.execute(stmt)
            org_ids = list(res.scalars().all())

            for org_id in org_ids:
                try:
                    await TrendService.create_daily_snapshot(db=session, organization_id=org_id)
                    logger.info("Created daily snapshot for organization: %s", org_id)
                except Exception as org_err:
                    logger.error("Failed to snapshot organization %s: %s", org_id, org_err)

            logger.info("Daily dashboard snapshot run completed.")
        except Exception as e:
            logger.error("Error in daily dashboard snapshot worker: %s", e)
