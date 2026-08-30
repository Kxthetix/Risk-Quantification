"""ControlEffectiveness ORM model for targeted threat and risk factor attenuation (Phase 8)."""
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
    CheckConstraint,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.control import Control

JSONType = JSON().with_variant(JSONB, "postgresql")


class ControlEffectiveness(Base, TimestampMixin):
    """Maps how a specific control reduces distinct threat types and risk factors."""
    __tablename__ = "control_effectiveness"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    control_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("controls.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    threat_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="e.g. WEB_EXPLOITATION, LATERAL_MOVEMENT, CREDENTIAL_THEFT, RANSOMWARE",
    )
    risk_factor: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        doc="e.g. EXPLOITATION_LIKELIHOOD, ATTACK_PATH_REACHABILITY, IMPACT_MAGNITUDE",
    )
    reduction_factor: Mapped[float] = mapped_column(
        Float,
        default=0.5,
        nullable=False,
        doc="Fractional reduction applied to the targeted risk factor (0.0 to 1.0)",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.8,
        nullable=False,
        doc="Confidence level in empirical reduction factor",
    )
    evidence: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Supporting benchmark, vendor telemetry, or empirical validation data",
    )

    # Relationships
    control: Mapped["Control"] = relationship(
        "Control",
        back_populates="effectiveness_mappings",
    )

    __table_args__ = (
        CheckConstraint("reduction_factor >= 0.0 AND reduction_factor <= 1.0", name="chk_ctrl_eff_reduction"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_ctrl_eff_conf"),
        Index("ix_ctrl_eff_control_threat", "control_id", "threat_type"),
    )
