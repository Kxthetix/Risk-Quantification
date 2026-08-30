"""AttackPath ORM model representing multi-step vulnerability and network traversal paths (Phase 7)."""
from typing import TYPE_CHECKING, Any, Dict, List, Optional
import uuid

from sqlalchemy import (
    Boolean,
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
from app.models.enums import AttackPathStatus

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.attack_path_edge import AttackPathEdge
    from app.models.attack_path_node import AttackPathNode
    from app.models.organization import Organization
    from app.models.threat_scenario import ThreatScenario

JSONType = JSON().with_variant(JSONB, "postgresql")


class AttackPath(Base, TimestampMixin):
    """Represents a discovered multi-hop path from an entry point to a critical target asset."""
    __tablename__ = "attack_paths"

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
        ForeignKey("threat_scenarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    source_node: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="e.g. Internet, Public Web Server, VPN Gateway",
    )
    target_node: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="e.g. Core Database, Payment Server",
    )
    target_asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    path_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Overall attack path severity / risk score (0.0 to 100.0)",
    )
    likelihood: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Compounded edge likelihood (0.0 to 1.0)",
    )
    impact: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Target business impact rating (0.0 to 100.0)",
    )
    financial_exposure: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Direct Expected Financial Loss from Phase 6 Financial Assessment",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Aggregated evidence and validation confidence (0.0 to 1.0)",
    )
    path_length: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="Number of hops / nodes along this attack path",
    )
    status: Mapped[AttackPathStatus] = mapped_column(
        Enum(AttackPathStatus, name="attack_path_status"),
        nullable=False,
        default=AttackPathStatus.POSSIBLE,
    )
    is_blocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="True if mitigating control or firewall rule stops the path",
    )
    blocking_control: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="Description of mitigating control preventing path traversal",
    )
    raw_path: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Serialized node and edge path summary",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="attack_paths",
    )
    scenario: Mapped["ThreatScenario"] = relationship(
        "ThreatScenario",
        back_populates="attack_paths",
    )
    target_asset: Mapped["Asset"] = relationship(
        "Asset",
        back_populates="attack_paths",
    )
    nodes: Mapped[List["AttackPathNode"]] = relationship(
        "AttackPathNode",
        back_populates="attack_path",
        cascade="all, delete-orphan",
        order_by="AttackPathNode.sequence",
    )
    edges: Mapped[List["AttackPathEdge"]] = relationship(
        "AttackPathEdge",
        back_populates="attack_path",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        CheckConstraint("path_score >= 0.0 AND path_score <= 100.0", name="chk_attack_path_score"),
        CheckConstraint("likelihood >= 0.0 AND likelihood <= 1.0", name="chk_attack_path_likelihood"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_attack_path_confidence"),
        Index("ix_attack_paths_org_score", "organization_id", "path_score"),
        Index("ix_attack_paths_org_target", "organization_id", "target_asset_id"),
    )
