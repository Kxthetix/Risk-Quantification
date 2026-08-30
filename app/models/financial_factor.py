"""Financial Factor and Assumption ORM models (Phase 6).

Stores granular probabilistic loss parameters, distributions, and assumption audit trails.
"""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict
import uuid

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, JSON, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID

if TYPE_CHECKING:
    from app.models.financial_assessment import FinancialAssessment


class FinancialFactor(Base):
    """Specific loss component and its underlying probability distribution."""
    __tablename__ = "financial_factors"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    financial_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("financial_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    factor_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    distribution_type: Mapped[str] = mapped_column(String(32), nullable=False, default="TRIANGULAR")

    # Distribution bounds
    minimum_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    most_likely_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    maximum_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    probability: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)  # Hurdle / occurrence prob

    # Simulation results for this component
    expected_value: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    contribution: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # % of total loss

    extra_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    # Relationships
    financial_assessment: Mapped["FinancialAssessment"] = relationship(
        "FinancialAssessment",
        back_populates="factors",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<FinancialFactor(type='{self.factor_type}', dist='{self.distribution_type}', expected={self.expected_value})>"


class FinancialAssumption(Base):
    """Audit log of modeling assumptions and parameter provenance."""
    __tablename__ = "financial_assumptions"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    financial_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("financial_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parameter: Mapped[str] = mapped_column(String(128), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=True)
    source: Mapped[str] = mapped_column(String(128), nullable=False, default="organization_input")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    user_provided: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    default_value: Mapped[str] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    financial_assessment: Mapped["FinancialAssessment"] = relationship(
        "FinancialAssessment",
        back_populates="assumptions",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<FinancialAssumption(param='{self.parameter}', val='{self.value} {self.unit}')>"
