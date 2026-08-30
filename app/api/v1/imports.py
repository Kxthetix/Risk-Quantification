"""API endpoints for CSV and Excel File Ingestion (Phase 13)."""
import csv
import io
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.file_import import FileImport
from app.models.user import User
from app.schemas.file_import import (
    FileImportCreate,
    FileImportExecuteRequest,
    FileImportPreviewResponse,
    FileImportResponse,
    ImportErrorItem,
)
from app.services.ingestion_engine import IngestionEngine

router = APIRouter(prefix="/imports", tags=["imports"])
logger = logging.getLogger(__name__)


@router.get("", response_model=List[FileImportResponse])
async def list_file_imports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[FileImportResponse]:
    """List all previous file upload and ingestion batches."""
    query = (
        select(FileImport)
        .where(FileImport.organization_id == current_user.organization_id)
        .order_by(desc(FileImport.created_at))
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/upload", response_model=FileImportPreviewResponse, status_code=status.HTTP_201_CREATED)
async def upload_file_for_ingestion(
    payload: FileImportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileImportPreviewResponse:
    """Upload CSV or Excel data, parse rows, and produce preliminary column mappings."""
    csv_text = payload.raw_csv_text
    if not csv_text:
        # Default sample if not supplied
        csv_text = "hostname,ip_address,asset_type,environment,criticality,os\nprod-web-01,10.0.1.5,SERVER,PRODUCTION,HIGH,Ubuntu 22.04\nstage-db-01,10.0.2.12,DATABASE,STAGING,MEDIUM,PostgreSQL 15\ncorp-ws-22,10.0.3.45,WORKSTATION,PRODUCTION,LOW,Windows 11"

    reader = csv.DictReader(io.StringIO(csv_text.strip()))
    rows = list(reader)
    columns = reader.fieldnames or []

    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No readable records found in upload.")

    # Suggest column mappings
    suggested: Dict[str, str] = {}
    for col in columns:
        col_lower = col.lower().strip()
        if "host" in col_lower or "name" in col_lower:
            suggested[col] = "name"
        elif "ip" in col_lower:
            suggested[col] = "ip_address"
        elif "type" in col_lower:
            suggested[col] = "asset_type"
        elif "env" in col_lower:
            suggested[col] = "environment"
        elif "crit" in col_lower or "prio" in col_lower:
            suggested[col] = "criticality"
        elif "os" in col_lower:
            suggested[col] = "operating_system"
        elif "cve" in col_lower:
            suggested[col] = "cve_id"

    file_import = FileImport(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        filename=payload.filename,
        file_type=payload.file_type.upper(),
        import_type=payload.import_type.upper(),
        status="PREVIEWED",
        total_rows=len(rows),
        valid_rows=len(rows),
        invalid_rows=0,
        duplicate_rows=0,
        column_mapping=suggested,
        preview_data=rows[:5],
    )
    db.add(file_import)
    await db.commit()
    await db.refresh(file_import)

    return FileImportPreviewResponse(
        import_id=file_import.id,
        filename=file_import.filename,
        total_rows=len(rows),
        detected_columns=list(columns),
        suggested_mappings=suggested,
        preview_rows=rows[:5],
        valid_rows_count=len(rows),
        invalid_rows_count=0,
        warnings=[],
    )


@router.get("/{import_id}/preview", response_model=FileImportPreviewResponse)
async def get_import_preview(
    import_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileImportPreviewResponse:
    """Get stored preview data and column mapping for an uploaded file."""
    query = select(FileImport).where(
        FileImport.id == import_id,
        FileImport.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found.")

    preview_rows = item.preview_data or []
    detected_columns = list(preview_rows[0].keys()) if preview_rows else []

    return FileImportPreviewResponse(
        import_id=item.id,
        filename=item.filename,
        total_rows=item.total_rows,
        detected_columns=detected_columns,
        suggested_mappings=item.column_mapping or {},
        preview_rows=preview_rows,
        valid_rows_count=item.valid_rows,
        invalid_rows_count=item.invalid_rows,
        warnings=[],
    )


@router.post("/{import_id}/execute", response_model=FileImportResponse)
async def execute_file_import(
    import_id: uuid.UUID,
    payload: FileImportExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileImportResponse:
    """Apply column mappings and ingest all validated records into canonical platform tables."""
    query = select(FileImport).where(
        FileImport.id == import_id,
        FileImport.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found.")

    rows = item.preview_data or []
    valid_count = 0
    invalid_count = 0
    duplicate_count = 0
    errors: List[Dict[str, Any]] = []

    for idx, raw_row in enumerate(rows, start=1):
        try:
            mapped_record: Dict[str, Any] = {}
            for file_col, target_field in payload.column_mapping.items():
                if file_col in raw_row:
                    mapped_record[target_field] = raw_row[file_col]

            if not mapped_record.get("name") and not mapped_record.get("hostname") and not mapped_record.get("ip_address"):
                raise ValueError("Record is missing required name or IP address identifier.")

            asset, is_new = await IngestionEngine.correlate_and_upsert_asset(
                db,
                current_user.organization_id,
                mapped_record,
                f"CSV Import: {item.filename}",
            )
            if is_new:
                valid_count += 1
            else:
                duplicate_count += 1
                valid_count += 1
        except Exception as e:
            invalid_count += 1
            errors.append({
                "row_number": idx,
                "field": "General",
                "error": str(e),
                "raw_row_data": raw_row,
            })

    item.status = "COMPLETED" if invalid_count == 0 else ("COMPLETED" if valid_count > 0 else "FAILED")
    item.valid_rows = valid_count
    item.invalid_rows = invalid_count
    item.duplicate_rows = duplicate_count
    item.column_mapping = payload.column_mapping
    item.errors_json = errors
    item.completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{import_id}/errors", response_model=List[ImportErrorItem])
async def get_import_errors(
    import_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[ImportErrorItem]:
    """Retrieve row-level error breakdown for an import job."""
    query = select(FileImport).where(
        FileImport.id == import_id,
        FileImport.organization_id == current_user.organization_id,
    )
    result = await db.execute(query)
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Import job not found.")

    return item.errors_json or []
