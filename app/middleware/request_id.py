"""Request ID propagation and context attachment middleware (Phase 10)."""
import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import request_id_ctx


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Assigns or propagates X-Request-ID and binds it to the async context."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Extract incoming X-Request-ID if provided by trusted upstream proxy, or generate new UUID4
        incoming_id = request.headers.get("X-Request-ID")
        req_id = incoming_id.strip() if incoming_id and len(incoming_id) <= 64 else str(uuid.uuid4())

        # Bind to context variable for thread/coroutine access
        token = request_id_ctx.set(req_id)
        request.state.request_id = req_id

        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = req_id
            return response
        finally:
            request_id_ctx.reset(token)
