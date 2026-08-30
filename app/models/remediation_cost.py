"""RemediationCost ORM model for granular cost modeling & uncertainty distributions (Phase 8)."""
from typing import TYPE_CHECKING, Optional
import uuid

from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.remediation import Remediation


class RemediationCost(Base, TimestampMixin):
    """Triangular/PERT uncertainty parameters and cost component breakdown for a remediation."""
    __tablename__ = "remediation_costs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    remediation_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("remediations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    minimum_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Best-case implementation cost",
    )
    most_likely_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Expected baseline implementation cost",
    )
    maximum_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Worst-case implementation cost",
    )
    currency: Mapped[str] = mapped_column(
        String(8),
        default="INR",
        nullable=False,
    )
    labor_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Engineering and operational labor cost",
    )
    technology_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Software, tool, or hardware procurement cost",
    )
    consulting_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Third-party professional services / audit cost",
    )
    downtime_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Cost incurred by scheduled service interruption during deployment",
    )
    licensing_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Annual recurring licensing fees",
    )
    recurring_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Total annual operating expenditure (OpEx)",
    )
    one_time_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Initial capital expenditure (CapEx)",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.8,
        nullable=False,
        doc="Cost estimation accuracy confidence (0.0 to 1.0)",
    )

    # Relationships
    remediation: Mapped["Remediation"] = relationship(
        "Remediation",
        back_populates="remediation_cost",
    )

    __table_args__ = (
        CheckConstraint("minimum_cost <= most_likely_cost AND most_likely_cost <= maximum_cost", name="chk_remediation_cost_order"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_remediation_cost_conf"),
    )
