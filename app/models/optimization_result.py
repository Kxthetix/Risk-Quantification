"""OptimizationResult ORM model for storing audit-grade portfolio optimization decisions (Phase 8)."""
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
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import OptimizationAlgorithm

if TYPE_CHECKING:
    from app.models.investment_scenario import InvestmentScenario
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class OptimizationResult(Base, TimestampMixin):
    """Stores full audit snapshot and mathematical portfolio selection results."""
    __tablename__ = "optimization_results"

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
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("investment_scenarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    algorithm: Mapped[OptimizationAlgorithm] = mapped_column(
        Enum(OptimizationAlgorithm, name="optimization_algorithm"),
        nullable=False,
        default=OptimizationAlgorithm.KNAPSACK,
    )
    budget: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    total_cost: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    expected_loss_before: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    expected_loss_after: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    expected_loss_reduction: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    roi: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Modeled ROI %",
    )
    risk_reduction_per_rupee: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Expected Loss Reduction / Total Cost",
    )
    critical_paths_reduced: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    selected_actions: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONType,
        nullable=False,
        doc="Array of selected remediations and controls with costs, benefits, and justifications",
    )
    input_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Snapshot of available candidate actions, constraints, and dependencies",
    )
    risk_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Snapshot of organization cyber risk profile at optimization run time",
    )
    financial_snapshot: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Snapshot of financial assessment distributions and expected losses",
    )
    optimization_model_version: Mapped[str] = mapped_column(
        String(32),
        default="1.0",
        nullable=False,
    )
    risk_model_version: Mapped[str] = mapped_column(
        String(32),
        default="1.0",
        nullable=False,
    )
    financial_model_version: Mapped[str] = mapped_column(
        String(32),
        default="1.0",
        nullable=False,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="optimization_results",
    )
    scenario: Mapped["InvestmentScenario"] = relationship(
        "InvestmentScenario",
        back_populates="optimization_results",
    )

    __table_args__ = (
        CheckConstraint("budget >= 0.0", name="chk_opt_budget"),
        CheckConstraint("total_cost >= 0.0", name="chk_opt_cost"),
        Index("ix_opt_org_created", "organization_id", "created_at"),
    )
