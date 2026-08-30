"""Tests for sliding window rate limiter and throttling (Phase 10)."""
import pytest
from app.core.config import settings
from app.core.rate_limit import SlidingWindowRateLimiter
from app.models.enums import RateLimitTier


@pytest.mark.asyncio
async def test_sliding_window_rate_limiter_logic():
    """Verify rate limiter allows within limit and rejects when threshold is exceeded."""
    limiter = SlidingWindowRateLimiter()
    key = "test-client-ip:127.0.0.1"

    # Assume limit of 3 for testing
    for i in range(settings.RATE_LIMIT_EXPENSIVE_RPM):
        res = await limiter.check_rate_limit(key=key, tier=RateLimitTier.EXPENSIVE)
        assert res.allowed is True
        assert res.remaining == settings.RATE_LIMIT_EXPENSIVE_RPM - (i + 1)

    # Next request should be throttled
    res_throttled = await limiter.check_rate_limit(key=key, tier=RateLimitTier.EXPENSIVE)
    assert res_throttled.allowed is False
    assert res_throttled.remaining == 0
    assert res_throttled.retry_after > 0
