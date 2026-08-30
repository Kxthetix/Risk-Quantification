"""Control ORM model representing enterprise security controls (Phase 8)."""
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import ControlType

if TYPE_CHECKING:
    from app.models.control_effectiveness import ControlEffectiveness
    from app.models.organization import Organization


class Control(Base, TimestampMixin):
    """Enterprise defensive cybersecurity control (e.g. WAF, EDR, MFA, Network Segmentation)."""
    __tablename__ = "controls"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="e.g. Cloudflare Enterprise WAF, CrowdStrike Falcon EDR, Duo MFA",
    )
    control_type: Mapped[ControlType] = mapped_column(
        Enum(ControlType, name="control_type"),
        nullable=False,
        default=ControlType.WAF,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    implementation_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Initial deployment / procurement cost (₹)",
    )
    annual_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Annual recurring licensing & maintenance cost (₹)",
    )
    effectiveness: Mapped[float] = mapped_column(
        Float,
        default=0.8,
        nullable=False,
        doc="Nominal defensive effectiveness rating (0.0 to 1.0)",
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="controls",
    )
    effectiveness_mappings: Mapped[List["ControlEffectiveness"]] = relationship(
        "ControlEffectiveness",
        back_populates="control",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("effectiveness >= 0.0 AND effectiveness <= 1.0", name="chk_control_effectiveness"),
        CheckConstraint("implementation_cost >= 0.0", name="chk_control_impl_cost"),
        CheckConstraint("annual_cost >= 0.0", name="chk_control_annual_cost"),
        Index("ix_controls_org_type", "organization_id", "control_type"),
    )
