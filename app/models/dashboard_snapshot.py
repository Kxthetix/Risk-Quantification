"""DashboardSnapshot ORM model for historical risk & financial tracking (Phase 9)."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class DashboardSnapshot(Base, TimestampMixin):
    """Daily or periodic aggregated snapshot of organizational risk and financial posture."""
    __tablename__ = "dashboard_snapshots"

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
    snapshot_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    risk_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Overall organizational cyber risk score (0-100)",
    )
    expected_loss: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Total modeled expected annual financial loss (₹)",
    )
    p50_loss: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Median modeled loss (P50)",
    )
    p90_loss: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="90th percentile modeled loss (P90)",
    )
    p95_loss: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="95th percentile modeled loss (P95)",
    )
    critical_findings: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    critical_assets: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    critical_attack_paths: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    open_remediations: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    overdue_remediations: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    security_investment: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    risk_reduction: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    control_coverage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Percentage average defensive control coverage (0-100)",
    )
    metrics_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Structured breakdown of vulnerability, control, and asset metrics at snapshot time",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="dashboard_snapshots",
    )

    __table_args__ = (
        Index("ix_snapshots_org_date", "organization_id", "snapshot_date"),
    )
