"""Financial Profile ORM model (Phase 6).

Stores organization-specific baseline financial figures and hourly loss metrics.
"""
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class FinancialProfile(Base, TimestampMixin):
    """Organization-specific financial assumptions and baseline parameters."""
    __tablename__ = "financial_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    # General Currency & Revenue
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    annual_revenue: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=0.0,
    )
    operating_days_per_year: Mapped[int] = mapped_column(Integer, nullable=False, default=250)
    hours_per_day: Mapped[int] = mapped_column(Integer, nullable=False, default=8)

    # Derived or explicit revenue metrics
    daily_revenue: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=0.0,
    )
    hourly_revenue: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=0.0,
    )
    average_hourly_revenue: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=0.0,
    )
    average_hourly_profit: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=0.0,
    )

    # Workforce Productivity
    employee_count: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    average_hourly_employee_cost: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=350.0,
    )

    # Incident Response & Forensic Rates
    incident_response_hourly_cost: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=2500.0,
    )
    security_team_size: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    backup_recovery_hourly_cost: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=1800.0,
    )

    # Customer & Data Breach Baseline
    customer_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1000)
    average_customer_value: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=5000.0,
    )
    cost_per_record: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=False,
        default=250.0,
    )

    # Relationship
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")

    def __repr__(self) -> str:
        return f"<FinancialProfile(org_id={self.organization_id}, currency='{self.currency}', revenue={self.annual_revenue})>"
