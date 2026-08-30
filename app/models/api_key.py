"""ORM model for API key authentication and secure integration access (Phase 12)."""
from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class ApiKey(Base, TimestampMixin):
    """Secure API Key records representing programmatic credentials.

    We only store SHA-256 hashes of the keys. The client-visible token
    is shown once during generation and never stored or returned again.
    """
    __tablename__ = "api_keys"

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
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    key_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        nullable=False,
        index=True,
        doc="SHA-256 hash of the generated API token.",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )
    last_used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")

    __table_args__ = (
        Index("ix_api_keys_org_active", "organization_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<ApiKey(id={self.id}, name='{self.name}', organization_id={self.organization_id})>"
