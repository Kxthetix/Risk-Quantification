"""RiskAssessment and RiskHistory ORM models for Cyber Risk Scoring Engine (Phase 5)."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    JSON,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import RiskLevel, RiskMethod

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.asset_vulnerability import AssetVulnerability
    from app.models.financial_assessment import FinancialAssessment
    from app.models.organization import Organization
    from app.models.risk_factor import RiskFactor
    from app.models.user import User


class RiskAssessment(Base, TimestampMixin):
    """Contextual Cyber Risk Assessment entity (Phase 5).

    Connects a validated vulnerability finding on an asset to its multi-factor
    cyber risk score (0-100), risk level, factor contributions, and audit snapshots.
    """
    __tablename__ = "risk_assessments"

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
    asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_vulnerability_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("asset_vulnerabilities.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Component Scores (0.0 to 100.0)
    likelihood_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    impact_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    exposure_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    exploitability_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    validation_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    control_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    business_criticality_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Final Risk Metrics
    final_risk_score: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    risk_level: Mapped[RiskLevel] = mapped_column(
        Enum(
            RiskLevel,
            name="risk_level_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    risk_method: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        default=RiskMethod.CONTEXTUAL_WEIGHTED.value,
    )
    risk_model_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0")

    # Explainability & Audit Snapshots
    explanation: Mapped[List[str]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )
    factors_snapshot: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )
    configuration_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    asset: Mapped["Asset"] = relationship("Asset", lazy="select")
    asset_vulnerability: Mapped["AssetVulnerability"] = relationship(
        "AssetVulnerability",
        lazy="select",
    )
    factors: Mapped[List["RiskFactor"]] = relationship(
        "RiskFactor",
        back_populates="risk_assessment",
        cascade="all, delete-orphan",
        lazy="select",
    )
    history: Mapped[List["RiskHistory"]] = relationship(
        "RiskHistory",
        back_populates="risk_assessment",
        cascade="all, delete-orphan",
        order_by="desc(RiskHistory.changed_at)",
        lazy="select",
    )
    financial_assessments: Mapped[List["FinancialAssessment"]] = relationship(
        "FinancialAssessment",
        back_populates="risk_assessment",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_risk_assessments_org_score", "organization_id", "final_risk_score"),
        Index("ix_risk_assessments_org_level", "organization_id", "risk_level"),
        Index("ix_risk_assessments_asset_score", "asset_id", "final_risk_score"),
    )

    def __repr__(self) -> str:
        return (
            f"<RiskAssessment(id={self.id}, score={self.final_risk_score}, "
            f"level='{self.risk_level}', asset_id={self.asset_id})>"
        )


class RiskHistory(Base):
    """Audit log of risk score recalculations and transitions (Phase 5)."""
    __tablename__ = "risk_history"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    risk_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("risk_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    previous_score: Mapped[float] = mapped_column(Float, nullable=True)
    new_score: Mapped[float] = mapped_column(Float, nullable=False)
    previous_level: Mapped[str] = mapped_column(String(32), nullable=True)
    new_level: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str] = mapped_column(String(1024), nullable=True)
    changed_by: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    risk_assessment: Mapped["RiskAssessment"] = relationship(
        "RiskAssessment",
        back_populates="history",
        lazy="select",
    )
    user: Mapped["User"] = relationship("User", lazy="select")

    def __repr__(self) -> str:
        return (
            f"<RiskHistory(assessment_id={self.risk_assessment_id}, "
            f"{self.previous_score} -> {self.new_score})>"
        )
