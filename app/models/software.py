"""Software ORM model storing normalized software identity for CPE/CVE matching in Phase 3."""
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Enum, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import Architecture, PackageManager

if TYPE_CHECKING:
    from app.models.asset_software import AssetSoftware


class Software(Base, TimestampMixin):
    """Software entity representing a discrete software product.

    The software record stores the normalized identity fields required for
    CPE-based vulnerability matching (Phase 3). Software records are
    organization-scoped to prevent cross-tenant data access.
    """
    __tablename__ = "software"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        nullable=False,
        index=True,
    )

    # Identity fields for CPE/CVE matching (Phase 3)
    vendor: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product_version: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    edition: Mapped[str] = mapped_column(String(100), nullable=True)

    # Platform metadata
    architecture: Mapped[Architecture] = mapped_column(
        Enum(Architecture, name="architecture_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=Architecture.UNKNOWN,
    )
    package_manager: Mapped[PackageManager] = mapped_column(
        Enum(PackageManager, name="package_manager_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PackageManager.UNKNOWN,
    )

    # CPE 2.3 formatted identifier for vulnerability matching
    # Format: cpe:2.3:type:vendor:product:version:update:edition:lang:sw_edition:target_sw:target_hw:other
    cpe: Mapped[str] = mapped_column(String(500), nullable=True, index=True)

    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Relationships
    asset_software: Mapped[List["AssetSoftware"]] = relationship(
        "AssetSoftware",
        back_populates="software",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        # Same vendor+product+version combo is unique within an organization
        UniqueConstraint(
            "organization_id", "vendor", "product_name", "product_version",
            name="uq_software_org_vendor_product_version",
        ),
        Index("ix_software_org_vendor", "organization_id", "vendor"),
        Index("ix_software_org_product", "organization_id", "product_name"),
        Index("ix_software_org_version", "organization_id", "product_version"),
    )

    def __repr__(self) -> str:
        return (
            f"<Software(id={self.id}, vendor='{self.vendor}', "
            f"product='{self.product_name}', version='{self.product_version}')>"
        )
