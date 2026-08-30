from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import AlertSeverity


class NotificationResponse(BaseModel):
    """Schema representing an in-app notification delivered to a user."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    severity: AlertSeverity
    read: bool
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def map_metadata_json(cls, data: Any) -> Any:
        if hasattr(data, "metadata_json"):
            return {
                "id": data.id,
                "organization_id": data.organization_id,
                "user_id": data.user_id,
                "title": data.title,
                "message": data.message,
                "severity": data.severity,
                "read": data.read,
                "created_at": data.created_at,
                "metadata": data.metadata_json,
            }
        return data



class NotificationPreferencesUpdate(BaseModel):
    """Configuration payload for notification channels preferences."""
    email_alerts_enabled: bool = Field(default=True)
    in_app_alerts_enabled: bool = Field(default=True)
    webhook_alerts_enabled: bool = Field(default=False)
    webhook_url: Optional[str] = Field(None)
    critical_only: bool = Field(default=False)


class NotificationPreferencesResponse(NotificationPreferencesUpdate):
    """Notification settings response payload."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    updated_at: datetime


class NotificationRuleCreate(BaseModel):
    """Payload to create a notification routing rule."""
    event_type: str = Field(..., description="e.g. Critical Incident, High Risk Detected")
    condition_operator: str = Field(default="EQ", description="e.g. EQ, GT, LT")
    condition_value: str = Field(..., description="e.g. Critical, 0.8")
    recipients: List[str] = Field(..., description="Target users, groups or email lists")
    channel: str = Field(default="Email + In-App", description="e.g. Email, Webhook, In-App")
    frequency: str = Field(default="Immediate", description="Immediate, Hourly, Daily")
    is_active: bool = Field(default=True)


class NotificationRuleUpdate(BaseModel):
    """Payload to update an existing notification routing rule."""
    event_type: Optional[str] = None
    condition_operator: Optional[str] = None
    condition_value: Optional[str] = None
    recipients: Optional[List[str]] = None
    channel: Optional[str] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


class NotificationRuleResponse(NotificationRuleCreate):
    """Response payload for a notification routing rule."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
