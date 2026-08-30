import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.asset import Asset
    from app.models.attack_path import AttackPath
    from app.models.business_service import BusinessService
    from app.models.control import Control
    from app.models.dashboard_snapshot import DashboardSnapshot
    from app.models.financial_assessment import FinancialAssessment
    from app.models.financial_profile import FinancialProfile
    from app.models.investment_scenario import InvestmentScenario
    from app.models.network_relationship import NetworkRelationship
    from app.models.optimization_result import OptimizationResult
    from app.models.remediation import Remediation
    from app.models.report_job import ReportJob
    from app.models.threat_scenario import ThreatScenario
    from app.models.user import User


class Organization(Base, TimestampMixin):
    """Organization entity representing a multi-tenant boundary."""
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    industry: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    assets: Mapped[List["Asset"]] = relationship(
        "Asset",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    financial_profile: Mapped["FinancialProfile"] = relationship(
        "FinancialProfile",
        back_populates="organization",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="select",
    )
    business_services: Mapped[List["BusinessService"]] = relationship(
        "BusinessService",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    financial_assessments: Mapped[List["FinancialAssessment"]] = relationship(
        "FinancialAssessment",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    network_relationships: Mapped[List["NetworkRelationship"]] = relationship(
        "NetworkRelationship",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    attack_paths: Mapped[List["AttackPath"]] = relationship(
        "AttackPath",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    threat_scenarios: Mapped[List["ThreatScenario"]] = relationship(
        "ThreatScenario",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    remediations: Mapped[List["Remediation"]] = relationship(
        "Remediation",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    controls: Mapped[List["Control"]] = relationship(
        "Control",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    investment_scenarios: Mapped[List["InvestmentScenario"]] = relationship(
        "InvestmentScenario",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    optimization_results: Mapped[List["OptimizationResult"]] = relationship(
        "OptimizationResult",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    dashboard_snapshots: Mapped[List["DashboardSnapshot"]] = relationship(
        "DashboardSnapshot",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    report_jobs: Mapped[List["ReportJob"]] = relationship(
        "ReportJob",
        back_populates="organization",
        cascade="all, delete-orphan",
        lazy="noload",
    )

    __table_args__ = (
        Index("ix_organizations_name_industry", "name", "industry"),
    )

    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name='{self.name}', industry='{self.industry}')>"
