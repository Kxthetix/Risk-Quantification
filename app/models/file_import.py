"""ORM model for CSV and Excel File Data Ingestion Jobs (Phase 13)."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class FileImport(Base):
    """Tracks uploaded file ingestion jobs and schema transformation batches."""
    __tablename__ = "file_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False, default="CSV")  # CSV, XLSX
    import_type = Column(String(50), nullable=False, default="ASSETS")  # ASSETS, VULNERABILITIES, BUSINESS_SERVICES, CONTROLS

    status = Column(String(50), nullable=False, default="UPLOADED")  # UPLOADED, PREVIEWED, PROCESSING, COMPLETED, FAILED

    total_rows = Column(Integer, nullable=False, default=0)
    valid_rows = Column(Integer, nullable=False, default=0)
    invalid_rows = Column(Integer, nullable=False, default=0)
    duplicate_rows = Column(Integer, nullable=False, default=0)

    column_mapping = Column(JSON, nullable=False, default=dict)
    preview_data = Column(JSON, nullable=True)
    errors_json = Column(JSON, nullable=True)  # List of {row: int, error: str, field: str}

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", backref="file_imports")
    user = relationship("User", backref="file_imports")
