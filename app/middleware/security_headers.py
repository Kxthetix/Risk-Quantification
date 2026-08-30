"""Security Headers injection middleware (Phase 10)."""
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Applies OWASP-recommended HTTP security headers to all outbound responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        if settings.SECURITY_HEADERS_ENABLED:
            headers = response.headers
            # Prevent MIME sniffing
            headers["X-Content-Type-Options"] = "nosniff"

            # Anti-clickjacking protection
            headers["X-Frame-Options"] = "DENY"

            # Referrer privacy policy
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

            # Browser permissions policy
            headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"

            # Content Security Policy
            headers["Content-Security-Policy"] = settings.CSP_POLICY

            # Strict-Transport-Security for HTTPS/TLS
            if settings.is_production:
                headers["Strict-Transport-Security"] = (
                    f"max-age={settings.HSTS_MAX_AGE_SECONDS}; includeSubDomains; preload"
                )

        return response
