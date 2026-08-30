"""AttackTechnique ORM model representing MITRE ATT&CK techniques (Phase 7)."""
from typing import TYPE_CHECKING, List, Optional
import uuid

from sqlalchemy import (
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.attack_path_node import AttackPathNode


class AttackTechnique(Base, TimestampMixin):
    """Catalog of MITRE ATT&CK techniques utilized across discovered attack paths."""
    __tablename__ = "attack_techniques"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    technique_id: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        index=True,
        doc="e.g. T1190, T1021, T1078",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="e.g. Exploit Public-Facing Application",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    tactic: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        doc="e.g. Initial Access, Lateral Movement, Privilege Escalation, Impact",
    )
    source: Mapped[str] = mapped_column(
        String(64),
        default="MITRE ATT&CK",
        nullable=False,
    )

    # Relationships
    nodes: Mapped[List["AttackPathNode"]] = relationship(
        "AttackPathNode",
        back_populates="technique",
    )

    __table_args__ = (
        UniqueConstraint("technique_id", name="uq_attack_technique_id"),
        Index("ix_attack_technique_tactic", "tactic"),
    )
