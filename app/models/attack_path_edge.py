"""AttackPathEdge ORM model representing transitions between nodes in an attack path (Phase 7)."""
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AttackPathEdgeType

if TYPE_CHECKING:
    from app.models.attack_path import AttackPath
    from app.models.attack_path_node import AttackPathNode

JSONType = JSON().with_variant(JSONB, "postgresql")


class AttackPathEdge(Base, TimestampMixin):
    """Represents a directional exploit or traversal step connecting two nodes along a path."""
    __tablename__ = "attack_path_edges"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    attack_path_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("attack_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_node_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("attack_path_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    destination_node_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("attack_path_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    edge_type: Mapped[AttackPathEdgeType] = mapped_column(
        Enum(AttackPathEdgeType, name="attack_path_edge_type"),
        nullable=False,
        default=AttackPathEdgeType.LATERAL_MOVEMENT,
    )
    probability: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
        doc="Edge traversal probability (0.0 to 1.0)",
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
        doc="Evidence confidence in edge feasibility (0.0 to 1.0)",
    )
    evidence: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Supporting scan evidence, exploit availability, or firewall rule",
    )
    is_blocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        doc="True if security control blocks traversal over this edge",
    )
    blocking_reason: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
    )

    # Relationships
    attack_path: Mapped["AttackPath"] = relationship(
        "AttackPath",
        back_populates="edges",
    )
    source_node: Mapped["AttackPathNode"] = relationship(
        "AttackPathNode",
        foreign_keys=[source_node_id],
    )
    destination_node: Mapped["AttackPathNode"] = relationship(
        "AttackPathNode",
        foreign_keys=[destination_node_id],
    )

    __table_args__ = (
        CheckConstraint("probability >= 0.0 AND probability <= 1.0", name="chk_attack_edge_prob"),
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="chk_attack_edge_conf"),
        Index("ix_attack_edge_path_src_dst", "attack_path_id", "source_node_id", "destination_node_id"),
    )
