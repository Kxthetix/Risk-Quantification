"""Evidence ORM model storing multi-source validation artifacts and telemetry."""
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Optional
import uuid

from sqlalchemy import (
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import EvidenceResult, EvidenceSource, EvidenceType

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.asset_vulnerability import AssetVulnerability
    from app.models.user import User


class Evidence(Base, TimestampMixin):
    """Artifact or observation establishing the presence, exploitability, or mitigation of a vulnerability."""
    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_vulnerability_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("asset_vulnerabilities.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    evidence_type: Mapped[EvidenceType] = mapped_column(
        Enum(
            EvidenceType,
            name="evidence_type_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    source: Mapped[EvidenceSource] = mapped_column(
        Enum(
            EvidenceSource,
            name="evidence_source_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        index=True,
    )
    value: Mapped[str] = mapped_column(Text, nullable=False)
    result: Mapped[EvidenceResult] = mapped_column(
        Enum(
            EvidenceResult,
            name="evidence_result_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=EvidenceResult.CONFIRMED,
        index=True,
    )
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )

    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    collected_by: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    extra_metadata: Mapped[Any] = mapped_column(
        "metadata",
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=True,
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", lazy="joined")
    asset_vulnerability: Mapped["AssetVulnerability"] = relationship(
        "AssetVulnerability", back_populates="evidence_items", lazy="select"
    )
    collector: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("ix_evidence_asset_type", "asset_id", "evidence_type"),
        Index("ix_evidence_vuln_type", "asset_vulnerability_id", "evidence_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<Evidence(id={self.id}, asset_id={self.asset_id}, "
            f"type='{self.evidence_type}', result='{self.result}', conf={self.confidence})>"
        )
