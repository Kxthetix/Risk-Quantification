"""Financial Assessment ORM model (Phase 6).

Stores aggregated Monte Carlo financial risk quantification outputs,
loss exceedance percentiles (P10, P50, P90, P95), and annual expected loss.
"""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List
import uuid

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.asset_vulnerability import AssetVulnerability
    from app.models.financial_distribution import FinancialDistribution
    from app.models.financial_factor import FinancialAssumption, FinancialFactor
    from app.models.organization import Organization
    from app.models.risk_assessment import RiskAssessment
    from app.models.simulation import SimulationJob


class FinancialAssessment(Base, TimestampMixin):
    """Quantified financial impact assessment generated from cyber risk factors."""
    __tablename__ = "financial_assessments"

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
        nullable=True,
        index=True,
    )
    risk_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("risk_assessments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Core Loss Figures
    estimated_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    expected_loss: Mapped[float] = mapped_column(Float, nullable=False, index=True)
    annual_expected_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0, index=True)
    minimum_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    maximum_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Percentiles / Value at Risk (VaR)
    p10_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    p25_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    p50_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    p75_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    p90_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    p95_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Category Cost Breakdown (Mean Expected per category)
    downtime_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    revenue_loss: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    response_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    forensics_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    recovery_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    productivity_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    data_breach_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    regulatory_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    customer_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    third_party_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    reputational_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # Simulation Metadata & Reproducibility
    simulation_count: Mapped[int] = mapped_column(Integer, nullable=False, default=10000)
    random_seed: Mapped[int] = mapped_column(Integer, nullable=False, default=42)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    model_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0")
    simulation_engine_version: Mapped[str] = mapped_column(String(32), nullable=False, default="1.0")

    # Audit & Reproducibility Snapshots
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )
    configuration_snapshot: Mapped[Dict[str, Any]] = mapped_column(
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
    asset_vulnerability: Mapped["AssetVulnerability"] = relationship("AssetVulnerability", lazy="select")
    risk_assessment: Mapped["RiskAssessment"] = relationship("RiskAssessment", lazy="select")

    factors: Mapped[List["FinancialFactor"]] = relationship(
        "FinancialFactor",
        back_populates="financial_assessment",
        cascade="all, delete-orphan",
        lazy="select",
    )
    assumptions: Mapped[List["FinancialAssumption"]] = relationship(
        "FinancialAssumption",
        back_populates="financial_assessment",
        cascade="all, delete-orphan",
        lazy="select",
    )
    distribution: Mapped["FinancialDistribution"] = relationship(
        "FinancialDistribution",
        back_populates="financial_assessment",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="select",
    )
    simulation_jobs: Mapped[List["SimulationJob"]] = relationship(
        "SimulationJob",
        back_populates="financial_assessment",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_financial_assessments_org_loss", "organization_id", "expected_loss"),
        Index("ix_financial_assessments_org_ale", "organization_id", "annual_expected_loss"),
        Index("ix_financial_assessments_asset_loss", "asset_id", "expected_loss"),
    )

    def __repr__(self) -> str:
        return (
            f"<FinancialAssessment(id={self.id}, expected_loss={self.expected_loss} {self.currency}, "
            f"p90={self.p90_loss}, ale={self.annual_expected_loss})>"
        )
