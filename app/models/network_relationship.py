"""NetworkRelationship ORM model representing topology and access between assets (Phase 7)."""
from typing import TYPE_CHECKING, Any, Dict, Optional
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
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import NetworkDirection, NetworkRelationshipType

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.organization import Organization

JSONType = JSON().with_variant(JSONB, "postgresql")


class NetworkRelationship(Base, TimestampMixin):
    """Represents a directional network access, trust, or dependency link between two assets."""
    __tablename__ = "network_relationships"

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
    source_asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    destination_asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    relationship_type: Mapped[NetworkRelationshipType] = mapped_column(
        Enum(NetworkRelationshipType, name="network_relationship_type"),
        nullable=False,
        default=NetworkRelationshipType.NETWORK_REACHABILITY,
    )
    protocol: Mapped[str] = mapped_column(
        String(32),
        nullable=True,
        doc="e.g. TCP, UDP, HTTPS, SSH",
    )
    port: Mapped[int] = mapped_column(
        Integer,
        nullable=True,
        doc="Destination port (1-65535)",
    )
    direction: Mapped[NetworkDirection] = mapped_column(
        Enum(NetworkDirection, name="network_direction"),
        nullable=False,
        default=NetworkDirection.OUTBOUND,
    )
    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        doc="Whether this relationship was verified by scanner/config/manual confirmation",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
        doc="Confidence in network reachability (0.0 to 1.0)",
    )
    evidence: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Supporting scan, firewall rule, or cloud security group metadata",
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="network_relationships",
    )
    source_asset: Mapped["Asset"] = relationship(
        "Asset",
        foreign_keys=[source_asset_id],
        back_populates="network_relationships_out",
    )
    destination_asset: Mapped["Asset"] = relationship(
        "Asset",
        foreign_keys=[destination_asset_id],
        back_populates="network_relationships_in",
    )

    __table_args__ = (
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_network_rel_confidence_range"),
        CheckConstraint("port IS NULL OR (port >= 1 AND port <= 65535)", name="chk_network_rel_port_range"),
        Index("ix_network_rel_org_source_dest", "organization_id", "source_asset_id", "destination_asset_id"),
    )
