"""Alert ORM model for executive and security anomaly alerts (Phase 9)."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AlertSeverity, AlertType

if TYPE_CHECKING:
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class Alert(Base, TimestampMixin):
    """Executive or operational security alert triggered by significant risk regressions."""
    __tablename__ = "alerts"

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
    alert_type: Mapped[AlertType] = mapped_column(
        Enum(AlertType, name="alert_type"),
        nullable=False,
        default=AlertType.CRITICAL_RISK_INCREASE,
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alert_severity"),
        nullable=False,
        default=AlertSeverity.HIGH,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="RISK_ENGINE",
        doc="e.g. RISK_ENGINE, ATTACK_GRAPH, SLA_MONITOR, FINANCIAL_MODEL",
    )
    acknowledged: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    acknowledged_by: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    acknowledged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="alerts",
    )

    __table_args__ = (
        Index("ix_alerts_org_ack", "organization_id", "acknowledged"),
        Index("ix_alerts_org_sev", "organization_id", "severity"),
    )
