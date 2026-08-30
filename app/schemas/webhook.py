"""Pydantic schemas for Inbound Webhooks (Phase 13)."""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class WebhookEndpointCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    event_types: List[str] = ["ALERT", "DETECTION", "INCIDENT", "VULNERABILITY"]


class WebhookEndpointResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    event_types: List[str]
    is_active: bool
    events_received: int
    events_failed: int
    last_event_at: Optional[datetime] = None
    created_at: datetime
    webhook_url: str = ""
    signing_secret: Optional[str] = None  # Only populated upon creation

    model_config = ConfigDict(from_attributes=True)


class WebhookPayloadIngest(BaseModel):
    event_type: str
    source_system: str
    data: Dict[str, Any]
    timestamp: Optional[datetime] = None


class WebhookIngestResult(BaseModel):
    status: str
    event_id: str
    message: str
    records_processed: int
