import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class UserRole(str, enum.Enum):
    """User roles supported in RBAC hierarchy."""
    ADMIN = "ADMIN"
    SECURITY_ANALYST = "SECURITY_ANALYST"
    MANAGER = "MANAGER"
    VIEWER = "VIEWER"

    @classmethod
    def hierarchy(cls) -> dict["UserRole", int]:
        """Numeric rank for hierarchical permission checks: higher rank inherits lower privileges."""
        return {
            cls.ADMIN: 40,
            cls.SECURITY_ANALYST: 30,
            cls.MANAGER: 20,
            cls.VIEWER: 10,
        }

    def has_permission(self, required_role: "UserRole") -> bool:
        """Check whether current role is greater than or equal to the required role."""
        hierarchy = self.hierarchy()
        return hierarchy.get(self, 0) >= hierarchy.get(required_role, 0)


class User(Base, TimestampMixin):
    """User entity associated with an Organization tenant."""
    __tablename__ = "users"

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
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", create_type=False, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.VIEWER,
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="users",
        lazy="joined",
    )

    __table_args__ = (
        Index("ix_users_org_role", "organization_id", "role"),
        Index("ix_users_org_active", "organization_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}', org_id={self.organization_id})>"
