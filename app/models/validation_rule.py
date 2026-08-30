"""ValidationRule ORM model for configurable confidence scoring weights and criteria."""
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import (
    Boolean,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class ValidationRule(Base, TimestampMixin):
    """Dynamic rule weighting evidence contributions to overall vulnerability validation."""
    __tablename__ = "validation_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    rule_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    evidence_type: Mapped[str] = mapped_column(String(100), nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    organization: Mapped["Organization"] = relationship("Organization", lazy="select")

    __table_args__ = (
        UniqueConstraint("rule_id", "organization_id", name="uq_rule_org"),
        Index("ix_rules_rule_org", "rule_id", "organization_id"),
    )

    def __repr__(self) -> str:
        return f"<ValidationRule(rule_id='{self.rule_id}', weight={self.weight}, enabled={self.enabled})>"
