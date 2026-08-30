"""Structured JSON logging configuration with sensitive data redaction (Phase 10)."""
import contextvars
from datetime import datetime, timezone
import json
import logging
import re
import sys
from typing import Any, Dict, Optional

from app.core.config import settings

# Context variables for tracing across async execution flows
request_id_ctx = contextvars.ContextVar[Optional[str]]("request_id_ctx", default=None)
user_id_ctx = contextvars.ContextVar[Optional[str]]("user_id_ctx", default=None)
org_id_ctx = contextvars.ContextVar[Optional[str]]("org_id_ctx", default=None)
client_ip_ctx = contextvars.ContextVar[Optional[str]]("client_ip_ctx", default=None)

# Sensitive keys to redact in structured metadata and message inspection
SENSITIVE_KEYS = {
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "jwt_secret",
    "authorization",
    "api_key",
    "credentials",
    "private_key",
    "secret_key",
}

SENSITIVE_PATTERNS = [
    re.compile(rf'(?i)("{k}"\s*:\s*)"[^"]+"', re.IGNORECASE) for k in SENSITIVE_KEYS
] + [
    re.compile(rf"(?i)({k}=)[^\s&]+", re.IGNORECASE) for k in SENSITIVE_KEYS
]


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redact sensitive key values from dicts, lists, or strings."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if any(sens in k.lower() for sens in SENSITIVE_KEYS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    elif isinstance(data, str):
        result = data
        for pat in SENSITIVE_PATTERNS:
            result = pat.sub(r'\1"[REDACTED]"', result)
        return result
    return data


class JSONFormatter(logging.Formatter):
    """Custom logging formatter rendering log records as structured JSON."""

    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": redact_sensitive_data(record.getMessage()),
            "environment": settings.APP_ENV,
        }

        # Inject context variables if available
        req_id = request_id_ctx.get()
        if req_id:
            log_obj["request_id"] = req_id

        u_id = user_id_ctx.get()
        if u_id:
            log_obj["user_id"] = u_id

        o_id = org_id_ctx.get()
        if o_id:
            log_obj["organization_id"] = o_id

        ip = client_ip_ctx.get()
        if ip:
            log_obj["client_ip"] = ip

        # Extra fields attached to the log record
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_obj["data"] = redact_sensitive_data(record.extra_data)

        # Exception information
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logging() -> None:
    """Configure root logger with structured JSON handler."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    # Clear existing handlers
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    if settings.STRUCTURED_LOGGING and not settings.is_testing:
        handler.setFormatter(JSONFormatter())
    else:
        # Standard readable formatting for local unit testing
        handler.setFormatter(
            logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
        )

    root_logger.addHandler(handler)


def get_logger(name: str) -> logging.Logger:
    """Obtain a named logger instance."""
    return logging.getLogger(name)
