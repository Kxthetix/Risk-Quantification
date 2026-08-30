"""CPE (Common Platform Enumeration) dictionary ORM model."""
import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.vulnerability import VulnerabilityCPE


class CPE(Base, TimestampMixin):
    """CPE dictionary entry representing a discrete hardware, OS, or application platform."""
    __tablename__ = "cpes"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    cpe_string: Mapped[str] = mapped_column(
        String(500),
        unique=True,
        nullable=False,
        index=True,
    )  # Formatted 2.3 string

    # Decomposed components for fast indexing & searching
    part: Mapped[str] = mapped_column(String(10), nullable=False, default="a", index=True)  # a, h, o
    vendor: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    product: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(100), nullable=False, default="*", index=True)
    update: Mapped[str] = mapped_column(String(100), nullable=False, default="*")
    edition: Mapped[str] = mapped_column(String(100), nullable=False, default="*")
    language: Mapped[str] = mapped_column(String(50), nullable=False, default="*")

    # Relationships
    vulnerability_cpes: Mapped[List["VulnerabilityCPE"]] = relationship(
        "VulnerabilityCPE",
        back_populates="cpe",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_cpes_vendor_product", "vendor", "product"),
        Index("ix_cpes_vendor_product_version", "vendor", "product", "version"),
    )

    def __repr__(self) -> str:
        return f"<CPE(cpe_string='{self.cpe_string}')>"
