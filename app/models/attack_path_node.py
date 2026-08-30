"""AttackPathNode ORM model representing individual hops along an attack path (Phase 7)."""
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
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
from app.models.enums import AttackPathNodeType

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.attack_path import AttackPath
    from app.models.attack_technique import AttackTechnique
    from app.models.vulnerability import Vulnerability

JSONType = JSON().with_variant(JSONB, "postgresql")


class AttackPathNode(Base, TimestampMixin):
    """Represents a discrete node (Asset, Vulnerability, Identity, or Service) in an attack path."""
    __tablename__ = "attack_path_nodes"

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
    node_type: Mapped[AttackPathNodeType] = mapped_column(
        Enum(AttackPathNodeType, name="attack_path_node_type"),
        nullable=False,
        default=AttackPathNodeType.ASSET,
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    vulnerability_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("vulnerabilities.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    technique_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("attack_techniques.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    label: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        doc="Display label (e.g. 'Apache 2.4.49 (CVE-2021-41773)')",
    )
    sequence: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        doc="0-indexed position in attack sequence",
    )
    score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
        doc="Node specific severity / exploitability / criticality score",
    )
    node_metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
    )

    # Relationships
    attack_path: Mapped["AttackPath"] = relationship(
        "AttackPath",
        back_populates="nodes",
    )
    asset: Mapped["Asset"] = relationship(
        "Asset",
    )
    vulnerability: Mapped["Vulnerability"] = relationship(
        "Vulnerability",
    )
    technique: Mapped["AttackTechnique"] = relationship(
        "AttackTechnique",
        back_populates="nodes",
    )

    __table_args__ = (
        Index("ix_attack_path_node_seq", "attack_path_id", "sequence"),
    )
