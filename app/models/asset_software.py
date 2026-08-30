"""Junction table linking Assets to Software packages with installation metadata."""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import SoftwareSource

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.software import Software


class AssetSoftware(Base, TimestampMixin):
    """Many-to-many junction model linking Assets to Software.

    Stores installation-specific metadata such as the installed version,
    installation path, discovery source, and active status for each
    Asset→Software relationship.
    """
    __tablename__ = "asset_software"

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
    software_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("software.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Installation-specific fields
    installed_version: Mapped[str] = mapped_column(String(100), nullable=True)
    installation_path: Mapped[str] = mapped_column(String(500), nullable=True)
    source: Mapped[SoftwareSource] = mapped_column(
        Enum(SoftwareSource, name="software_source_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=SoftwareSource.MANUAL,
    )

    # Discovery timestamps
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="asset_software")
    software: Mapped["Software"] = relationship("Software", back_populates="asset_software")

    __table_args__ = (
        # Prevent duplicate asset-software pairs
        UniqueConstraint("asset_id", "software_id", name="uq_asset_software_pair"),
        Index("ix_asset_software_asset", "asset_id"),
        Index("ix_asset_software_software", "software_id"),
        Index("ix_asset_software_active", "asset_id", "is_active"),
    )

    def __repr__(self) -> str:
        return f"<AssetSoftware(asset_id={self.asset_id}, software_id={self.software_id})>"
