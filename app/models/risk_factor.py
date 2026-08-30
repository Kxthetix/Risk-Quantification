"""RiskFactor ORM model capturing individual factor contributions to an assessment."""
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import Float, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.risk_assessment import RiskAssessment


class RiskFactor(Base, TimestampMixin):
    """Normalized risk factor record contributing to a cyber risk assessment (Phase 5)."""
    __tablename__ = "risk_factors"

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
    factor_name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    raw_value: Mapped[str] = mapped_column(String(255), nullable=True)
    normalized_value: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    contribution: Mapped[float] = mapped_column(Float, nullable=False)
    extra_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    # Relationships
    risk_assessment: Mapped["RiskAssessment"] = relationship(
        "RiskAssessment",
        back_populates="factors",
        lazy="select",
    )

    def __repr__(self) -> str:
        return (
            f"<RiskFactor(name='{self.factor_name}', raw='{self.raw_value}', "
            f"norm={self.normalized_value}, contribution={self.contribution})>"
        )
