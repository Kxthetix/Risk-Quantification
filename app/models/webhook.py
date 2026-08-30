"""ORM model for Inbound Webhook Endpoints (Phase 13)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class WebhookEndpoint(Base):
    """Registered inbound webhook receiver for external security events."""
    __tablename__ = "webhook_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    secret_hash = Column(String(255), nullable=False)  # For HMAC-SHA256 signature verification
    event_types = Column(JSON, nullable=False, default=list)  # ["ALERT", "DETECTION", "INCIDENT", "VULNERABILITY"]

    is_active = Column(Boolean, nullable=False, default=True)
    events_received = Column(Integer, nullable=False, default=0)
    events_failed = Column(Integer, nullable=False, default=0)
    last_event_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationship
    organization = relationship("Organization", backref="webhook_endpoints")
