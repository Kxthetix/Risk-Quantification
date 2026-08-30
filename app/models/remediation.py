"""Remediation ORM model for prioritization and treatment lifecycle (Phase 8)."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import RemediationPriorityLevel, RemediationStatus, RemediationType

if TYPE_CHECKING:
    from app.models.asset_vulnerability import AssetVulnerability
    from app.models.organization import Organization
    from app.models.remediation_cost import RemediationCost

JSONType = JSON().with_variant(JSONB, "postgresql")


class Remediation(Base, TimestampMixin):
    """Represents a contextual vulnerability remediation action with priority & risk reduction."""
    __tablename__ = "remediations"

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
    asset_vulnerability_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("asset_vulnerabilities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Linked finding / vulnerability",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="e.g. Upgrade Apache HTTP Server to >= 2.4.50",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    remediation_type: Mapped[RemediationType] = mapped_column(
        Enum(RemediationType, name="remediation_type"),
        nullable=False,
        default=RemediationType.PATCH,
    )
    status: Mapped[RemediationStatus] = mapped_column(
        Enum(RemediationStatus, name="remediation_status"),
        nullable=False,
        default=RemediationStatus.OPEN,
    )
    priority_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Multi-factor contextual priority score (0.0 to 100.0)",
    )
    priority_level: Mapped[RemediationPriorityLevel] = mapped_column(
        Enum(RemediationPriorityLevel, name="remediation_priority_level"),
        nullable=False,
        default=RemediationPriorityLevel.MEDIUM,
    )
    estimated_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Most likely financial implementation cost (₹)",
    )
    estimated_duration_hours: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Most likely remediation effort / business downtime in hours",
    )
    risk_reduction: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Calculated reduction in cyber risk points",
    )
    expected_loss_reduction: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Calculated reduction in annual expected loss (₹)",
    )
    owner: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="Assigned engineer or team lead",
    )
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    depends_on_remediation_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("remediations.id", ondelete="SET NULL"),
        nullable=True,
        doc="Prerequisite remediation that must be completed first",
    )
    risk_acceptance_reason: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    risk_accepted_by: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    risk_accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    risk_acceptance_expiry: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    verification_evidence: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Empirical evidence proving remediation was applied (rescan / validation)",
    )
    verification_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="remediations",
    )
    asset_vulnerability: Mapped["AssetVulnerability"] = relationship(
        "AssetVulnerability",
    )
    remediation_cost: Mapped["RemediationCost"] = relationship(
        "RemediationCost",
        back_populates="remediation",
        uselist=False,
        cascade="all, delete-orphan",
    )
    prerequisite: Mapped["Remediation"] = relationship(
        "Remediation",
        remote_side="[Remediation.id]",
        foreign_keys=[depends_on_remediation_id],
        backref="dependents",
    )

    __table_args__ = (
        CheckConstraint("priority_score >= 0.0 AND priority_score <= 100.0", name="chk_remediation_priority_score"),
        CheckConstraint("risk_reduction >= 0.0", name="chk_remediation_risk_reduction"),
        CheckConstraint("expected_loss_reduction >= 0.0", name="chk_remediation_loss_reduction"),
        Index("ix_remediations_org_status", "organization_id", "status"),
        Index("ix_remediations_org_priority", "organization_id", "priority_score"),
    )
