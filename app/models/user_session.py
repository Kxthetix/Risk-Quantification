"""User session and refresh token ORM model (Phase 10)."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class UserSession(Base, TimestampMixin):
    """User login session and refresh token metadata."""
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        doc="Cryptographic hash of the issued refresh token identifier (jti)",
    )
    device_info: Mapped[str] = mapped_column(
        String(500),
        nullable=True,
        doc="Client User-Agent / client identification",
    )
    ip_address: Mapped[str] = mapped_column(
        String(45),
        nullable=True,
        doc="Client remote IP address (IPv4 / IPv6)",
    )
    expires_at: Mapped[datetime] = mapped_column(
        nullable=False,
        doc="Expiration timestamp of the refresh token",
    )
    revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        doc="Whether this session / token has been explicitly revoked",
    )
    revoked_at: Mapped[datetime] = mapped_column(
        nullable=True,
        doc="Timestamp of explicit revocation or logout",
    )

    # Relationships
    user: Mapped["User"] = relationship("User", backref="sessions")
    organization: Mapped["Organization"] = relationship("Organization")

    __table_args__ = (
        Index("ix_user_sessions_user_active", "user_id", "revoked"),
    )

    @property
    def is_valid(self) -> bool:
        """Evaluate if the session token is active and not expired."""
        if self.revoked:
            return False
        # Normalize timezone comparison
        exp = self.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) < exp
