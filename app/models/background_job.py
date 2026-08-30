"""Background job execution and reliability ORM model (Phase 10)."""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict
import uuid

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, GUID, TimestampMixin
from app.models.enums import JobStatus, JobType

if TYPE_CHECKING:
    from app.models.organization import Organization


class BackgroundJob(Base, TimestampMixin):
    """Reliable background job execution record with idempotency and retry budget."""
    __tablename__ = "background_jobs"

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
    job_type: Mapped[JobType] = mapped_column(
        Enum(JobType, name="job_type_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(255),
        nullable=True,
        index=True,
        doc="Client-provided Idempotency-Key header to prevent duplicate job creation",
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status_enum", create_type=False,
             values_callable=lambda x: [e.value for e in x]),
        default=JobStatus.QUEUED,
        nullable=False,
        index=True,
    )
    progress_percentage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    max_attempts: Mapped[int] = mapped_column(
        Integer,
        default=3,
        nullable=False,
    )
    payload: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="Job execution parameters",
    )
    result_data: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=True,
        doc="Structured results output upon completion",
    )
    error_code: Mapped[str] = mapped_column(
        String(100),
        nullable=True,
    )
    error_message: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization")

    __table_args__ = (
        Index("ix_background_jobs_idempotency", "organization_id", "idempotency_key"),
        Index("ix_background_jobs_status_type", "status", "job_type"),
    )
