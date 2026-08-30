"""Simulation Job ORM model (Phase 6).

Tracks asynchronous Monte Carlo computation progress and execution status.
"""
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import SimulationStatus

if TYPE_CHECKING:
    from app.models.financial_assessment import FinancialAssessment
    from app.models.organization import Organization


class SimulationJob(Base, TimestampMixin):
    """Background tracking entity for high-iteration Monte Carlo runs."""
    __tablename__ = "simulation_jobs"

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
    financial_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("financial_assessments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    status: Mapped[SimulationStatus] = mapped_column(
        Enum(
            SimulationStatus,
            name="simulation_status_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=SimulationStatus.QUEUED,
        index=True,
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    simulations_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_simulations: Mapped[int] = mapped_column(Integer, nullable=False, default=10000)
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    financial_assessment: Mapped["FinancialAssessment"] = relationship(
        "FinancialAssessment",
        back_populates="simulation_jobs",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_simulation_jobs_org_status", "organization_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<SimulationJob(id={self.id}, status='{self.status}', progress={self.progress}%)>"
