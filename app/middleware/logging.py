"""HTTP request and response structured logging middleware (Phase 10)."""
import time
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import client_ip_ctx, get_logger, org_id_ctx, user_id_ctx

logger = get_logger("app.access")


class LoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP requests and response performance metrics in structured JSON."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()

        # Capture Client IP
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        ip_token = client_ip_ctx.set(client_ip)

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)

            # Extract rate limit headers from request state if set
            if hasattr(request.state, "rate_limit_limit"):
                response.headers["X-RateLimit-Limit"] = str(request.state.rate_limit_limit)
                response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
                response.headers["X-RateLimit-Reset"] = str(request.state.rate_limit_reset)

            # Log request execution
            logger.info(
                f"{request.method} {request.url.path} HTTP/{request.scope.get('http_version', '1.1')} {response.status_code} ({duration_ms}ms)",
                extra={
                    "extra_data": {
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                        "client_ip": client_ip,
                    }
                },
            )
            return response
        finally:
            client_ip_ctx.reset(ip_token)
