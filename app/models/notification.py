"""ORM model for in-app and email notifications (Phase 12)."""
from datetime import datetime
from typing import Any, Dict, Optional
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AlertSeverity

JSONType = JSON().with_variant(JSONB, "postgresql")


class Notification(Base, TimestampMixin):
    """Notification entity representing in-app messages delivered to specific users."""
    __tablename__ = "notifications"

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
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="notification_severity"),
        nullable=False,
        default=AlertSeverity.INFO,
        index=True,
    )
    read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    # Optional JSON payload containing action redirects or object references
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        "metadata",
        JSONType,
        nullable=True,
    )

    # Relationships
    organization: Mapped["app.models.organization.Organization"] = relationship(
        "Organization",
        lazy="select",
    )
    user: Mapped["app.models.user.User"] = relationship(
        "User",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "read"),
        Index("ix_notifications_org_severity", "organization_id", "severity"),
    )

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, read={self.read}, title='{self.title}')>"
