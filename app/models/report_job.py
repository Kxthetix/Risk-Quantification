"""ReportJob ORM model for asynchronous report generation (Phase 9)."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional
import uuid

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import ReportFormat, ReportStatus, ReportType

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User

JSONType = JSON().with_variant(JSONB, "postgresql")


class ReportJob(Base, TimestampMixin):
    """Tracks asynchronous report generation requests and completed artifact metadata."""
    __tablename__ = "report_jobs"

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
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_type: Mapped[ReportType] = mapped_column(
        Enum(ReportType, name="report_type"),
        nullable=False,
        default=ReportType.EXECUTIVE_RISK,
    )
    period: Mapped[str] = mapped_column(
        String(32),
        default="30d",
        nullable=False,
    )
    report_format: Mapped[ReportFormat] = mapped_column(
        Enum(ReportFormat, name="report_format"),
        nullable=False,
        default=ReportFormat.JSON,
    )
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"),
        nullable=False,
        default=ReportStatus.QUEUED,
        index=True,
    )
    file_path: Mapped[str] = mapped_column(
        String(512),
        nullable=True,
        doc="Local or storage path to generated artifact (PDF, CSV, XLSX)",
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=True,
        doc="Size in bytes of generated file",
    )
    report_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONType,
        nullable=True,
        doc="Full structured report JSON payload",
    )
    error_message: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates="report_jobs",
    )
    user: Mapped["User"] = relationship(
        "User",
    )

    __table_args__ = (
        Index("ix_reports_org_status", "organization_id", "status"),
        Index("ix_reports_org_type", "organization_id", "report_type"),
    )
