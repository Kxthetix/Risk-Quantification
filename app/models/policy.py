"""ORM model for security policy configurations (Phase 12)."""
from typing import Any, Dict
import uuid

from sqlalchemy import Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin

JSONType = JSON().with_variant(JSONB, "postgresql")


class Policy(Base, TimestampMixin):
    """Configuration storage for password policies, idle session timeouts, and MFA requirements."""
    __tablename__ = "security_policies"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        unique=True,
        doc="Each organization has exactly one security policy record.",
    )
    # Store settings in JSON
    password_policy: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=False,
        default=lambda: {
            "min_length": 12,
            "complexity_required": True,
            "expiration_days": 90,
            "history_limit": 5,
            "lockout_attempts": 5,
            "lockout_duration_mins": 30,
        },
    )
    session_policy: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=False,
        default=lambda: {
            "timeout_seconds": 900,
            "max_duration_seconds": 86400,
            "concurrent_sessions_limit": 3,
            "idle_timeout_seconds": 600,
        },
    )
    mfa_policy: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=False,
        default=lambda: {
            "mfa_required": False,
            "mfa_method": "TOTP",
            "recovery_options_enabled": True,
            "grace_period_days": 7,
        },
    )
    data_retention_policy: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=False,
        default=lambda: {
            "audit_logs_retention_years": 7,
            "incidents_retention_years": 5,
            "alerts_retention_days": 180,
            "reports_retention_days": 365,
        },
    )

    # Relationships
    organization: Mapped["app.models.organization.Organization"] = relationship(
        "Organization",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Policy(id={self.id}, organization_id={self.organization_id})>"
