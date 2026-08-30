"""Global unhandled exception catching middleware (Phase 10)."""
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from fastapi import status

from app.core.exceptions import _format_error_response
from app.core.logging import get_logger

logger = get_logger("app.error")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Guarantees all unhandled server exceptions return sanitized JSON without stack traces."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            logger.exception(f"Unhandled exception processing {request.method} {request.url.path}: {exc}")
            req_id = getattr(request.state, "request_id", None)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=_format_error_response(
                    message="An unexpected internal server error occurred.",
                    error_code="INTERNAL_SERVER_ERROR",
                    details=None,
                    request_id=req_id,
                ),
            )
