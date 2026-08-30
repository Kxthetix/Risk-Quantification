"""ORM model for Integration Execution & Synchronization Logs (Phase 13)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class IntegrationLog(Base):
    """Immutable record of an integration sync run, test connection, or webhook event."""
    __tablename__ = "integration_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)

    operation = Column(String(100), nullable=False)  # SYNC, TEST, WEBHOOK_INGEST, FULL_SYNC, MAPPING_APPLY
    status = Column(String(50), nullable=False)  # SUCCESS, PARTIAL, FAILED, RUNNING

    records_received = Column(Integer, nullable=False, default=0)
    records_accepted = Column(Integer, nullable=False, default=0)
    records_rejected = Column(Integer, nullable=False, default=0)
    records_updated = Column(Integer, nullable=False, default=0)
    records_created = Column(Integer, nullable=False, default=0)

    duration_ms = Column(Float, nullable=False, default=0.0)
    error_type = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationship
    integration = relationship("Integration", back_populates="logs")
