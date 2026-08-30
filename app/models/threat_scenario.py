"""ThreatScenario ORM model for threat scenario modeling and simulation (Phase 7)."""
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AttackerProfile, ThreatScenarioStatus

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.attack_path import AttackPath
    from app.models.financial_assessment import FinancialAssessment
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class ThreatScenario(Base, TimestampMixin):
    """Represents a threat scenario (e.g. Ransomware, Data Exfiltration, Supply Chain Compromise)."""
    __tablename__ = "threat_scenarios"

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
        doc="Human-readable scenario title",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    attacker_profile: Mapped[AttackerProfile] = mapped_column(
        Enum(AttackerProfile, name="attacker_profile"),
        nullable=False,
        default=AttackerProfile.EXTERNAL_ATTACKER,
    )
    objective: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="e.g. Data Exfiltration, Ransomware Deployment, Service Disruption",
    )
    entry_point: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="e.g. Public Web Server, VPN Gateway",
    )
    target_asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    target_asset_name: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )
    probability: Mapped[float] = mapped_column(
        Float,
        default=0.5,
        nullable=False,
        doc="Estimated scenario likelihood (0.0 to 1.0)",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.8,
        nullable=False,
        doc="Evidence confidence in scenario plausibility (0.0 to 1.0)",
    )
    risk_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Composite risk score (0.0 to 100.0)",
    )
    financial_assessment_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("financial_assessments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        doc="Linked Phase 6 Financial Assessment for target impact quantification",
    )
    status: Mapped[ThreatScenarioStatus] = mapped_column(
        Enum(ThreatScenarioStatus, name="threat_scenario_status"),
        nullable=False,
        default=ThreatScenarioStatus.ACTIVE,
    )
    scenario_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Additional technique lists, narrative templates, or generator parameters",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="threat_scenarios",
    )
    target_asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="threat_scenarios",
    )
    financial_assessment: Mapped["FinancialAssessment"] = relationship(
        "FinancialAssessment",
    )
    attack_paths: Mapped[List["AttackPath"]] = relationship(
        "AttackPath",
        back_populates="scenario",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="chk_threat_scenario_prob"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_threat_scenario_conf"),
        CheckConstraint("risk_score >= 0.0 AND risk_score <= 100.0", name="chk_threat_scenario_risk"),
        Index("ix_threat_scenarios_org_status", "organization_id", "status"),
    )
