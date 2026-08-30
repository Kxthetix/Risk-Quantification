from typing import Any, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import request_id_ctx


class AppException(Exception):
    """Base application exception for domain errors."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        details: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details
        super().__init__(self.message)


class NotFoundError(AppException):
    def __init__(
        self,
        message: str = "Requested resource not found",
        error_code: str = "NOT_FOUND",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code=error_code,
            details=details,
        )


class AuthenticationError(AppException):
    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTHENTICATION_FAILED",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=error_code,
            details=details,
        )


class AuthorizationError(AppException):
    def __init__(
        self,
        message: str = "You do not have permission to perform this action",
        error_code: str = "PERMISSION_DENIED",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=error_code,
            details=details,
        )


class DuplicateResourceError(AppException):
    def __init__(
        self,
        message: str = "Resource already exists",
        error_code: str = "DUPLICATE_RESOURCE",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code=error_code,
            details=details,
        )


class BadRequestError(AppException):
    def __init__(
        self,
        message: str = "Invalid request payload or parameters",
        error_code: str = "BAD_REQUEST",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=error_code,
            details=details,
        )


class RateLimitExceededError(AppException):
    def __init__(
        self,
        message: str = "Rate limit exceeded. Please try again later.",
        error_code: str = "RATE_LIMIT_EXCEEDED",
        retry_after: int = 60,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code=error_code,
            details={"retry_after_seconds": retry_after},
        )


class IdempotencyConflictError(AppException):
    def __init__(
        self,
        message: str = "A request with this Idempotency-Key is currently running or already executed.",
        error_code: str = "IDEMPOTENCY_CONFLICT",
        details: Optional[Any] = None,
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code=error_code,
            details=details,
        )


def _format_error_response(
    message: str,
    error_code: str,
    details: Optional[Any] = None,
    request_id: Optional[str] = None,
) -> dict[str, Any]:
    req_id = request_id or request_id_ctx.get()
    return {
        "success": False,
        "message": message,
        "error_code": error_code,
        "error": {
            "code": error_code,
            "message": message,
            "request_id": req_id,
            "details": details,
        },
        "details": details,
        "request_id": req_id,
    }


def register_exception_handlers(app: FastAPI) -> None:
    """Register centralized exception handlers on the FastAPI application."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_format_error_response(
                message=exc.message,
                error_code=exc.error_code,
                details=exc.details,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = []
        for err in exc.errors():
            loc = " -> ".join(str(e) for e in err.get("loc", []))
            errors.append({
                "field": loc,
                "message": err.get("msg"),
                "type": err.get("type"),
            })
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_format_error_response(
                message="Validation error in request parameters or body",
                error_code="VALIDATION_ERROR",
                details=errors,
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        error_code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = "UNAUTHORIZED"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            error_code = "FORBIDDEN"
        elif exc.status_code == status.HTTP_404_NOT_FOUND:
            error_code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            error_code = "METHOD_NOT_ALLOWED"
        elif exc.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            error_code = "RATE_LIMIT_EXCEEDED"

        headers = getattr(exc, "headers", None)
        return JSONResponse(
            status_code=exc.status_code,
            headers=headers,
            content=_format_error_response(
                message=str(exc.detail),
                error_code=error_code,
                details=None,
            ),
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # In production, avoid leaking internal implementation details
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_format_error_response(
                message="An unexpected internal server error occurred",
                error_code="INTERNAL_SERVER_ERROR",
                details=None,
            ),
        )
