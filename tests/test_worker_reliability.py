"""Tests for background workers, retries, backoff, and idempotency keys (Phase 10)."""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import JobStatus, JobType
from app.models.organization import Organization
from app.workers.scheduler import JobScheduler
from app.workers.worker import background_worker


@pytest.mark.asyncio
async def test_job_idempotency_deduplication(
    db_session: AsyncSession,
    test_org: Organization,
):
    """Verify jobs with the same Idempotency-Key are deduplicated."""
    idempotency_key = "idemp-key-monte-carlo-20260829"

    # 1. Create first job
    job1, created1 = await background_worker.create_or_get_job(
        db=db_session,
        organization_id=test_org.id,
        job_type=JobType.MONTE_CARLO,
        payload={"iterations": 1000},
        idempotency_key=idempotency_key,
    )
    assert created1 is True
    assert job1.status == JobStatus.QUEUED

    # 2. Create second job with identical key (should return existing)
    job2, created2 = await background_worker.create_or_get_job(
        db=db_session,
        organization_id=test_org.id,
        job_type=JobType.MONTE_CARLO,
        payload={"iterations": 1000},
        idempotency_key=idempotency_key,
    )
    assert created2 is False
    assert job2.id == job1.id


@pytest.mark.asyncio
async def test_job_scheduler_retry_and_backoff(
    db_session: AsyncSession,
    test_org: Organization,
):
    """Verify JobScheduler retries transient failures up to max_attempts."""
    job, _ = await background_worker.create_or_get_job(
        db=db_session,
        organization_id=test_org.id,
        job_type=JobType.OPTIMIZATION,
        payload={"budget": 50000},
        max_attempts=2,
    )

    attempt_counter = 0

    async def flaky_task():
        nonlocal attempt_counter
        attempt_counter += 1
        if attempt_counter == 1:
            raise RuntimeError("Temporary worker timeout")
        return {"status": "optimized", "roi": 3.4}

    result = await JobScheduler.execute_with_retry(
        db=db_session,
        job_id=job.id,
        task_func=flaky_task,
    )

    assert result is not None
    assert result["roi"] == 3.4
    assert job.status == JobStatus.COMPLETED
    assert job.attempts == 2
