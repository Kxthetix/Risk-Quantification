"""Business Service ORM model (Phase 6).

Represents a critical business function or service supported by IT assets
(e.g., Payment Gateway, Customer Portal, ERP, HR Management).
"""
from typing import TYPE_CHECKING, List
import uuid

from sqlalchemy import BigInteger, Enum, Float, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import AssetCriticality

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.organization import Organization


class BusinessService(Base, TimestampMixin):
    """Critical business service or revenue-generating function."""
    __tablename__ = "business_services"

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
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    # Financial and operational parameters
    revenue_dependency: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=1.0,
    )  # 0.0 to 1.0
    criticality: Mapped[AssetCriticality] = mapped_column(
        Enum(
            AssetCriticality,
            name="asset_criticality_enum",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
        default=AssetCriticality.HIGH,
        index=True,
    )
    daily_transaction_count: Mapped[int] = mapped_column(
        BigInteger,
        nullable=True,
        default=0,
    )
    average_transaction_value: Mapped[float] = mapped_column(
        Float,
        nullable=True,
        default=0.0,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", lazy="select")
    assets: Mapped[List["Asset"]] = relationship(
        "Asset",
        back_populates="business_service",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_business_services_org_name", "organization_id", "name"),
    )

    def __repr__(self) -> str:
        return f"<BusinessService(id={self.id}, name='{self.name}', dependency={self.revenue_dependency})>"
