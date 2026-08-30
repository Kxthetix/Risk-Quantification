"""Background worker coordinator and idempotency manager (Phase 10)."""
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import IdempotencyConflictError
from app.core.logging import get_logger
from app.models.background_job import BackgroundJob
from app.models.enums import JobStatus, JobType

logger = get_logger("app.worker")


class BackgroundWorker:
    """Manages async job creation with client idempotency key deduplication."""

    @staticmethod
    async def create_or_get_job(
        db: AsyncSession,
        organization_id: uuid.UUID,
        job_type: JobType,
        payload: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
        max_attempts: int = 3,
    ) -> Tuple[BackgroundJob, bool]:
        """
        Create a new background job, or return existing completed/running job if Idempotency-Key matches.
        Returns: (job, created_flag)
        """
        if idempotency_key:
            # Check existing job with this key
            stmt = select(BackgroundJob).where(
                BackgroundJob.organization_id == organization_id,
                BackgroundJob.idempotency_key == idempotency_key,
            )
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if existing:
                if existing.status in [JobStatus.RUNNING, JobStatus.QUEUED]:
                    logger.info(f"Duplicate job request with key '{idempotency_key}' currently active")
                    return existing, False
                elif existing.status == JobStatus.COMPLETED:
                    logger.info(f"Idempotent job hit for key '{idempotency_key}': returning cached result")
                    return existing, False

        # Create new job
        job = BackgroundJob(
            organization_id=organization_id,
            job_type=job_type,
            idempotency_key=idempotency_key,
            status=JobStatus.QUEUED,
            payload=payload,
            max_attempts=max_attempts,
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job, True

    @staticmethod
    async def get_job_status(
        db: AsyncSession,
        organization_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> Optional[BackgroundJob]:
        """Retrieve background job status and results."""
        stmt = select(BackgroundJob).where(
            BackgroundJob.id == job_id,
            BackgroundJob.organization_id == organization_id,
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()


background_worker = BackgroundWorker()
