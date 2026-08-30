"""RiskRule ORM model for configurable cyber risk scoring weights and tenant overrides."""
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import Boolean, Float, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class RiskRule(Base, TimestampMixin):
    """Configurable scoring weight and parameters for cyber risk calculation (Phase 5).

    Global system default rules have organization_id=None.
    Organizations can define custom rule weights and parameters to override defaults.
    """
    __tablename__ = "risk_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    factor: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    parameters: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<RiskRule(factor='{self.factor}', weight={self.weight}, "
            f"enabled={self.enabled}, org_id={self.organization_id})>"
        )
