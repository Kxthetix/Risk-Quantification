"""Asset ORM model representing an organization's hardware, software, or cloud resource."""
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    DataClassification,
)

if TYPE_CHECKING:
    from app.models.asset_software import AssetSoftware
    from app.models.asset_vulnerability import AssetVulnerability
    from app.models.attack_path import AttackPath
    from app.models.business_service import BusinessService
    from app.models.financial_assessment import FinancialAssessment
    from app.models.network_relationship import NetworkRelationship
    from app.models.organization import Organization
    from app.models.risk_assessment import RiskAssessment
    from app.models.threat_scenario import ThreatScenario


class Asset(Base, TimestampMixin):
    """Asset entity bound to a specific Organization tenant.

    Assets represent any IT resource (physical, virtual, or cloud) belonging to
    an organization. They form the root entity for vulnerability, risk, and
    financial impact analysis in later phases.
    """
    __tablename__ = "assets"

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

    # Identification
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    asset_type: Mapped[AssetType] = mapped_column(
        Enum(AssetType, name="asset_type_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )

    # Network / hardware identity
    hostname: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True, index=True)   # IPv4 or IPv6
    mac_address: Mapped[str] = mapped_column(String(17), nullable=True)

    # Operating system
    operating_system: Mapped[str] = mapped_column(String(100), nullable=True)
    os_version: Mapped[str] = mapped_column(String(50), nullable=True)

    # Classification
    environment: Mapped[AssetEnvironment] = mapped_column(
        Enum(AssetEnvironment, name="asset_environment_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssetEnvironment.OTHER,
        index=True,
    )
    criticality: Mapped[AssetCriticality] = mapped_column(
        Enum(AssetCriticality, name="asset_criticality_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssetCriticality.MEDIUM,
        index=True,
    )
    data_classification: Mapped[DataClassification] = mapped_column(
        Enum(DataClassification, name="data_classification_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=DataClassification.INTERNAL,
        index=True,
    )

    # Financial / business information (used by Phase 6)
    business_service_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("business_services.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    business_value: Mapped[float] = mapped_column(
        Numeric(precision=20, scale=2),
        nullable=True,
        default=0.0,
    )
    financial_dependency_factor: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    # Risk input flags (used by Phase 5)
    internet_exposed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    # Lifecycle
    status: Mapped[AssetStatus] = mapped_column(
        Enum(AssetStatus, name="asset_status_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AssetStatus.ACTIVE,
        index=True,
    )

    # Operational metadata
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    owner: Mapped[str] = mapped_column(String(255), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="assets",
        lazy="joined",
    )
    asset_software: Mapped[List["AssetSoftware"]] = relationship(
        "AssetSoftware",
        back_populates="asset",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    asset_vulnerabilities: Mapped[List["AssetVulnerability"]] = relationship(
        "AssetVulnerability",
        back_populates="asset",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    risk_assessments: Mapped[List["RiskAssessment"]] = relationship(
        "RiskAssessment",
        back_populates="asset",
        cascade="all, delete-orphan",
        lazy="select",
    )
    business_service: Mapped["BusinessService"] = relationship(
        "BusinessService",
        back_populates="assets",
        lazy="select",
    )
    financial_assessments: Mapped[List["FinancialAssessment"]] = relationship(
        "FinancialAssessment",
        back_populates="asset",
        cascade="all, delete-orphan",
        lazy="select",
    )
    network_relationships_out: Mapped[List["NetworkRelationship"]] = relationship(
        "NetworkRelationship",
        foreign_keys="[NetworkRelationship.source_asset_id]",
        back_populates="source_asset",
        cascade="all, delete-orphan",
        lazy="select",
    )
    network_relationships_in: Mapped[List["NetworkRelationship"]] = relationship(
        "NetworkRelationship",
        foreign_keys="[NetworkRelationship.destination_asset_id]",
        back_populates="destination_asset",
        cascade="all, delete-orphan",
        lazy="select",
    )
    attack_paths: Mapped[List["AttackPath"]] = relationship(
        "AttackPath",
        back_populates="target_asset",
        lazy="select",
    )
    threat_scenarios: Mapped[List["ThreatScenario"]] = relationship(
        "ThreatScenario",
        back_populates="target_asset",
        lazy="select",
    )

    __table_args__ = (
        # Hostname must be unique within an organization (not globally)
        UniqueConstraint("organization_id", "hostname", name="uq_asset_org_hostname"),
        # Business value must not be negative
        CheckConstraint("business_value IS NULL OR business_value >= 0", name="chk_asset_business_value_non_negative"),
        # Composite indexes for common query patterns
        Index("ix_assets_org_type", "organization_id", "asset_type"),
        Index("ix_assets_org_criticality", "organization_id", "criticality"),
        Index("ix_assets_org_env", "organization_id", "environment"),
        Index("ix_assets_org_status", "organization_id", "status"),
        Index("ix_assets_org_exposed", "organization_id", "internet_exposed"),
    )

    def __repr__(self) -> str:
        return (
            f"<Asset(id={self.id}, name='{self.name}', type='{self.asset_type}', "
            f"org_id={self.organization_id})>"
        )
