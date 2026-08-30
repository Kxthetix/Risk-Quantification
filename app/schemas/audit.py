from datetime import datetime
from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AuditAction


class AuditLogResponse(BaseModel):
    """Schema for a single row in the high-level audit logs table."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    user_email: Optional[str] = Field(None, description="Email of the actor who performed the action")
    action: AuditAction
    resource_type: str
    resource_id: Optional[str] = None
    result: str = Field(default="SUCCESS", description="SUCCESS or FAILURE")
    source_ip: Optional[str] = Field(None, description="Client source IP address")
    created_at: datetime


class AuditLogDetailResponse(AuditLogResponse):
    """Schema for detailed immutable audit log record view (Phase 12)."""
    before_state: Optional[Dict[str, Any]] = Field(None, description="Resource attributes prior to action")
    after_state: Optional[Dict[str, Any]] = Field(None, description="Resource attributes post action")
    metadata_json: Optional[Dict[str, Any]] = Field(None, alias="metadata", description="Event request meta details")
