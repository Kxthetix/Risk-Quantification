from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard success API response envelope."""
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class ErrorResponse(BaseModel):
    """Standard error API response schema."""
    success: bool = False
    message: str
    error_code: str
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    """Basic health check response."""
    status: str = "healthy"
    app: str = "Cybersecurity Risk & Financial Impact Platform"
    environment: str = "development"


class DatabaseHealthResponse(BaseModel):
    """Database connectivity health check response."""
    status: str = "healthy"
    database: str = "connected"
    latency_ms: float
