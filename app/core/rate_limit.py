"""Rate limiting engine supporting tiered sliding-window throttling (Phase 10)."""
import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
import time
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.models.enums import RateLimitTier


@dataclass
class RateLimitResult:
    allowed: bool
    limit: int
    remaining: int
    reset_seconds: int
    retry_after: int = 0


class SlidingWindowRateLimiter:
    """In-memory sliding-window rate limiter with sub-second accuracy."""

    def __init__(self):
        self._lock = asyncio.Lock()
        # Storage: key -> List of request timestamps (epoch floats)
        self._requests: Dict[str, List[float]] = {}
        self._last_cleanup = time.time()

    def get_tier_limit(self, tier: RateLimitTier) -> int:
        """Fetch request limit per minute for a specific tier."""
        if tier == RateLimitTier.ANONYMOUS:
            return settings.RATE_LIMIT_ANONYMOUS_RPM
        elif tier == RateLimitTier.AUTHENTICATED:
            return settings.RATE_LIMIT_AUTHENTICATED_RPM
        elif tier == RateLimitTier.EXPENSIVE:
            return settings.RATE_LIMIT_EXPENSIVE_RPM
        return settings.RATE_LIMIT_AUTHENTICATED_RPM

    async def check_rate_limit(
        self,
        key: str,
        tier: RateLimitTier = RateLimitTier.ANONYMOUS,
        window_seconds: int = 60,
    ) -> RateLimitResult:
        """Check if request for `key` is within allowed limit."""
        if not settings.RATE_LIMIT_ENABLED:
            limit = self.get_tier_limit(tier)
            return RateLimitResult(allowed=True, limit=limit, remaining=limit, reset_seconds=0)

        limit = self.get_tier_limit(tier)
        now = time.time()
        window_start = now - window_seconds

        async with self._lock:
            # Periodic cleanup of old keys every 60s
            if now - self._last_cleanup > 60:
                self._cleanup(now)

            reqs = self._requests.setdefault(key, [])
            # Filter timestamps older than the sliding window
            self._requests[key] = [ts for ts in reqs if ts > window_start]
            current_count = len(self._requests[key])

            if current_count >= limit:
                oldest_ts = self._requests[key][0]
                retry_after = max(1, int(oldest_ts + window_seconds - now))
                return RateLimitResult(
                    allowed=False,
                    limit=limit,
                    remaining=0,
                    reset_seconds=retry_after,
                    retry_after=retry_after,
                )

            self._requests[key].append(now)
            remaining = max(0, limit - len(self._requests[key]))
            reset_seconds = window_seconds
            return RateLimitResult(
                allowed=True,
                limit=limit,
                remaining=remaining,
                reset_seconds=reset_seconds,
            )

    def _cleanup(self, now: float) -> None:
        """Evict stale window keys."""
        cutoff = now - 120
        expired_keys = [k for k, v in self._requests.items() if not v or v[-1] < cutoff]
        for k in expired_keys:
            self._requests.pop(k, None)
        self._last_cleanup = now

    def reset(self) -> None:
        """Clear all rate limit tracking."""
        self._requests.clear()


rate_limiter = SlidingWindowRateLimiter()


def get_client_identifier(request: Request) -> str:
    """Extract unique client identifier: prefer user ID if present, fallback to client IP."""
    # Check if user state was set by auth middleware/dependency
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"

    # Forwarded IP from reverse proxy / load balancer
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    elif request.client:
        client_ip = request.client.host
    else:
        client_ip = "127.0.0.1"

    return f"ip:{client_ip}"


async def enforce_rate_limit(
    request: Request,
    tier: RateLimitTier = RateLimitTier.ANONYMOUS,
) -> None:
    """FastAPI dependency to enforce rate limiting on specific endpoints."""
    identifier = get_client_identifier(request)
    result = await rate_limiter.check_rate_limit(key=f"{identifier}:{tier.value}", tier=tier)

    # Set rate limit headers on request state for middleware to emit
    request.state.rate_limit_limit = result.limit
    request.state.rate_limit_remaining = result.remaining
    request.state.rate_limit_reset = result.reset_seconds

    if not result.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please slow down your requests.",
            headers={
                "Retry-After": str(result.retry_after),
                "X-RateLimit-Limit": str(result.limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(result.reset_seconds),
            },
        )
