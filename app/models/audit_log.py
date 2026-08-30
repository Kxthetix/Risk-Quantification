"""Audit log model for recording security-relevant actions for compliance and forensics."""
import uuid
from typing import Any

from sqlalchemy import Enum, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AuditAction


class AuditLog(Base, TimestampMixin):
    """Immutable audit log entry.

    Records all significant create/update/delete operations performed by users.
    Must never contain passwords, JWT tokens, or other secrets.
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        nullable=False,
        index=True,
    )
    action: Mapped[AuditAction] = mapped_column(
        Enum(AuditAction, name="audit_action_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(36), nullable=True)
    # Store additional context as JSON (never store secrets here)
    metadata_json: Mapped[Any] = mapped_column(
        "metadata",
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    __table_args__ = (
        Index("ix_audit_org_action", "organization_id", "action"),
        Index("ix_audit_user", "user_id"),
        Index("ix_audit_resource", "resource_type", "resource_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, action='{self.action}', "
            f"resource='{self.resource_type}/{self.resource_id}')>"
        )
