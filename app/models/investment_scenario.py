"""InvestmentScenario ORM model for cybersecurity budget optimization scenarios (Phase 8)."""
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import InvestmentScenarioStatus

if TYPE_CHECKING:
    from app.models.optimization_result import OptimizationResult
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class InvestmentScenario(Base, TimestampMixin):
    """Budget and strategy parameters for cybersecurity portfolio investment optimization."""
    __tablename__ = "investment_scenarios"

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
        doc="e.g. FY2026 Q4 Security Hardening, Critical Infrastructure Shield",
    )
    budget: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Total available financial budget (₹)",
    )
    currency: Mapped[str] = mapped_column(
        String(8),
        default="INR",
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[InvestmentScenarioStatus] = mapped_column(
        Enum(InvestmentScenarioStatus, name="investment_scenario_status"),
        nullable=False,
        default=InvestmentScenarioStatus.DRAFT,
    )
    horizon_years: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
        doc="Investment assessment horizon in years (1, 3, 5)",
    )
    discount_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Annual financial discount rate (0.0 to 0.20)",
    )
    scenario_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="investment_scenarios",
    )
    optimization_results: Mapped[List["OptimizationResult"]] = relationship(
        "OptimizationResult",
        back_populates="scenario",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("budget >= 0.0", name="chk_investment_budget"),
        CheckConstraint("horizon_years IN (1, 3, 5)", name="chk_investment_horizon"),
        Index("ix_investment_scenarios_org_status", "organization_id", "status"),
    )
