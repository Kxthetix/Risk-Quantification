"""Background worker for asynchronous report generation (Phase 9)."""
import asyncio
import logging
import uuid

from app.core.database import async_session_factory
from app.services.reporting_service import ReportingService

logger = logging.getLogger(__name__)


async def run_report_generation(job_id: uuid.UUID) -> None:
    """Execute asynchronous report compilation in the background."""
    async with async_session_factory() as session:
        try:
            logger.info("Starting report generation job: %s", job_id)
            await ReportingService.process_report_job(db=session, job_id=job_id)
            logger.info("Report generation job completed successfully: %s", job_id)
        except Exception as e:
            logger.error("Failed to execute report generation job %s: %s", job_id, e)
