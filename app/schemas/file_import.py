"""Pydantic schemas for File Data Ingestion (CSV / Excel) (Phase 13)."""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict


class FileImportCreate(BaseModel):
    filename: str
    file_type: str = "CSV"  # CSV, XLSX
    import_type: str = "ASSETS"  # ASSETS, VULNERABILITIES, BUSINESS_SERVICES, CONTROLS
    raw_content_base64: Optional[str] = None
    raw_csv_text: Optional[str] = None


class ColumnMappingItem(BaseModel):
    file_column: str
    target_field: str
    sample_values: List[str] = []
    is_required: bool = False


class FileImportPreviewResponse(BaseModel):
    import_id: uuid.UUID
    filename: str
    total_rows: int
    detected_columns: List[str]
    suggested_mappings: Dict[str, str]
    preview_rows: List[Dict[str, Any]]
    valid_rows_count: int
    invalid_rows_count: int
    warnings: List[str] = []


class FileImportExecuteRequest(BaseModel):
    column_mapping: Dict[str, str]
    skip_invalid_rows: bool = True


class FileImportResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    filename: str
    file_type: str
    import_type: str
    status: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    column_mapping: Dict[str, Any] = {}
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ImportErrorItem(BaseModel):
    row_number: int
    field: Optional[str] = None
    error: str
    raw_row_data: Optional[Dict[str, Any]] = None
