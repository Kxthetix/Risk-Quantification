"""Reliable background task scheduler with retries, exponential backoff, and timeouts (Phase 10)."""
import asyncio
from datetime import datetime, timezone
import functools
import logging
import time
from typing import Any, Callable, Coroutine, Dict, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.models.background_job import BackgroundJob
from app.models.enums import JobStatus, JobType
from app.monitoring.metrics import metrics_collector

logger = get_logger("app.scheduler")


class JobScheduler:
    """Orchestrates resilient background task execution with exponential backoff and dead-letter tracking."""

    @staticmethod
    async def execute_with_retry(
        db: AsyncSession,
        job_id: uuid.UUID,
        task_func: Callable[..., Coroutine[Any, Any, Dict[str, Any]]],
        *args: Any,
        **kwargs: Any,
    ) -> Optional[Dict[str, Any]]:
        """Run an async job with automatic retry budget, exponential backoff, and timeout."""
        stmt = select(BackgroundJob).where(BackgroundJob.id == job_id)
        res = await db.execute(stmt)
        job = res.scalar_one_or_none()
        if not job:
            logger.error(f"Job {job_id} not found in database")
            return None

        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        await db.commit()

        attempt = 0
        backoff_seconds = 1.0
        start_time = time.time()

        while attempt < job.max_attempts:
            attempt += 1
            job.attempts = attempt
            try:
                # Enforce timeout guard
                result = await asyncio.wait_for(
                    task_func(*args, **kwargs),
                    timeout=settings.WORKER_TIMEOUT_SECONDS,
                )
                # Success
                job.status = JobStatus.COMPLETED
                job.progress_percentage = 100
                job.result_data = result
                job.completed_at = datetime.now(timezone.utc)
                await db.commit()

                duration = time.time() - start_time
                metrics_collector.record_job_execution(job.job_type.value, "COMPLETED", duration)
                logger.info(f"Job {job_id} ({job.job_type.value}) completed successfully on attempt {attempt}")
                return result

            except asyncio.TimeoutError:
                logger.warning(f"Job {job_id} attempt {attempt} timed out after {settings.WORKER_TIMEOUT_SECONDS}s")
                job.error_code = "TIMEOUT"
                job.error_message = f"Task timed out after {settings.WORKER_TIMEOUT_SECONDS}s"
            except Exception as exc:
                logger.warning(f"Job {job_id} attempt {attempt} failed: {exc}")
                job.error_code = "EXECUTION_FAILURE"
                job.error_message = str(exc)

            if attempt < job.max_attempts:
                job.status = JobStatus.RETRYING
                await db.commit()
                logger.info(f"Retrying job {job_id} in {backoff_seconds}s (attempt {attempt+1}/{job.max_attempts})")
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2.0  # Exponential backoff

        # Dead-letter / Final Failure
        job.status = JobStatus.FAILED
        job.completed_at = datetime.now(timezone.utc)
        await db.commit()

        duration = time.time() - start_time
        metrics_collector.record_job_execution(job.job_type.value, "FAILED", duration)
        logger.error(f"Job {job_id} ({job.job_type.value}) exceeded max retry budget of {job.max_attempts}")
        return None
