"""ORM model for External Security Integrations (Phase 13)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Integration(Base):
    """Represents a configured external security system connector."""
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # SIEM, EDR, VULNERABILITY_SCANNER, IAM, CLOUD, THREAT_INTEL, TICKETING, etc.
    connector_type = Column(String(100), nullable=False)  # splunk, crowdstrike, nessus, okta, aws, jira, webhook, custom_api
    
    status = Column(String(50), nullable=False, default="DISCONNECTED")  # CONNECTED, DISCONNECTED, DEGRADED, SYNCING, FAILED
    auth_method = Column(String(50), nullable=False, default="API_KEY")  # API_KEY, OAUTH2, BASIC_AUTH, BEARER_TOKEN, WEBHOOK_SECRET, CLOUD_ROLE
    
    endpoint_url = Column(String(1024), nullable=True)
    credentials_hash = Column(String(255), nullable=True)
    credentials_encrypted = Column(Text, nullable=True)
    
    sync_frequency = Column(String(50), nullable=False, default="HOURLY")  # EVERY_15_MINUTES, HOURLY, DAILY, WEEKLY, MANUAL
    sync_mode = Column(String(50), nullable=False, default="INCREMENTAL")  # INCREMENTAL, FULL
    is_enabled = Column(Boolean, nullable=False, default=True)
    
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String(50), nullable=True)
    last_error = Column(Text, nullable=True)
    
    data_types_supported = Column(JSON, nullable=False, default=list)  # ["ASSETS", "VULNERABILITIES", "EVENTS"]
    field_mappings = Column(JSON, nullable=False, default=dict)
    transformation_rules = Column(JSON, nullable=False, default=dict)
    metadata_json = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", backref="integrations")
    logs = relationship("IntegrationLog", back_populates="integration", cascade="all, delete-orphan")
