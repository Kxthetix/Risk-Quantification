"""Report generation, scheduling and history REST router (Phase 9 + Phase 11)."""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.enums import AuditAction, ReportFormat, ReportType
from app.models.user import User, UserRole
from app.schemas.report import (
    ExecutiveReportDocument,
    ReportGenerateRequest,
    ReportJobResponse,
)
from app.schemas.executive import (
    ReportHistoryResponse,
    ReportHistoryItem,
    ReportScheduleCreate,
    ReportScheduleResponse,
    ReportScheduleUpdate,
)
from app.services.audit_service import AuditService
from app.services.reporting_service import ReportingService

router = APIRouter(prefix="/reports", tags=["Reports & Executive Reporting"])


@router.post("", response_model=ReportJobResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    payload: ReportGenerateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiate asynchronous executive or compliance report compilation."""
    job = await ReportingService.create_report_job(
        db=db,
        organization_id=current_user.organization_id,
        user=current_user,
        payload=payload,
    )

    # Compile immediately or queue via background task
    await ReportingService.process_report_job(db=db, job_id=job.id)
    await db.refresh(job)

    return ReportJobResponse.model_validate(job)


@router.get("", response_model=List[ReportJobResponse], summary="List Reports")
async def list_reports(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReportJobResponse]:
    """List all reports for the organization."""
    jobs = await ReportingService.list_report_jobs(
        db=db,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
    )
    return [ReportJobResponse.model_validate(j) for j in jobs]


@router.get("/executive-document", response_model=ExecutiveReportDocument)
async def get_executive_document(
    period: str = Query("30d", description="Time range: 7d, 30d, 90d, 6m, 1y"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full 12-section executive report document data structure directly."""
    return await ReportingService.generate_executive_report_document(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
    )


@router.get("/history", response_model=ReportHistoryResponse, summary="Get Report History")
async def get_report_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportHistoryResponse:
    """Report generation history with status, period, and author."""
    jobs = await ReportingService.list_report_jobs(
        db=db,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
    )
    items = [
        ReportHistoryItem(
            id=j.id,
            report_name=j.report_type.value.replace("_", " ").title(),
            report_type=j.report_type.value,
            generated_by=str(j.user_id),
            status=j.status.value,
            format=j.report_format.value,
            created_at=j.created_at,
        )
        for j in jobs
    ]
    return ReportHistoryResponse(items=items, total=len(items), page=page, page_size=page_size)


# ─── Schedules ───────────────────────────────────────────────────────────────

# In-memory schedule store (replace with DB model in production)
_schedules: Dict[str, Any] = {}


@router.get(
    "/schedules",
    response_model=List[ReportScheduleResponse],
    summary="List Report Schedules",
)
async def list_report_schedules(
    current_user: User = Depends(get_current_user),
) -> List[ReportScheduleResponse]:
    """List all active report schedules for the organization."""
    org_schedules = [
        s for s in _schedules.values()
        if s["organization_id"] == str(current_user.organization_id)
    ]
    return [ReportScheduleResponse(**s["data"]) for s in org_schedules]


@router.post(
    "/schedules",
    response_model=ReportScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Report Schedule",
)
async def create_report_schedule(
    payload: ReportScheduleCreate,
    current_user: User = Depends(get_current_user),
) -> ReportScheduleResponse:
    """Create a recurring report schedule."""
    schedule_id = uuid.uuid4()
    now = datetime.now(tz=timezone.utc)
    freq_days = {"daily": 1, "weekly": 7, "monthly": 30, "quarterly": 90}
    next_run = now + timedelta(days=freq_days.get(payload.frequency, 7))
    data = {
        "id": schedule_id,
        "report_name": payload.report_name,
        "report_type": payload.report_type,
        "frequency": payload.frequency,
        "recipients": payload.recipients,
        "start_date": payload.start_date or now,
        "end_date": payload.end_date,
        "last_sent": None,
        "next_scheduled": next_run,
        "status": "active",
        "created_at": now,
    }
    _schedules[str(schedule_id)] = {
        "organization_id": str(current_user.organization_id),
        "data": data,
    }
    return ReportScheduleResponse(**data)


@router.put(
    "/schedules/{schedule_id}",
    response_model=ReportScheduleResponse,
    summary="Update Report Schedule",
)
async def update_report_schedule(
    schedule_id: uuid.UUID,
    payload: ReportScheduleUpdate,
    current_user: User = Depends(get_current_user),
) -> ReportScheduleResponse:
    """Update a recurring report schedule."""
    sid = str(schedule_id)
    if sid not in _schedules or _schedules[sid]["organization_id"] != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    rec = _schedules[sid]["data"]
    if payload.frequency:
        rec["frequency"] = payload.frequency
    if payload.recipients is not None:
        rec["recipients"] = payload.recipients
    if payload.end_date:
        rec["end_date"] = payload.end_date
    if payload.status:
        rec["status"] = payload.status
    return ReportScheduleResponse(**rec)


@router.delete(
    "/schedules/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Report Schedule",
)
async def delete_report_schedule(
    schedule_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a report schedule."""
    sid = str(schedule_id)
    if sid not in _schedules or _schedules[sid]["organization_id"] != str(current_user.organization_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    del _schedules[sid]


@router.get("/{id}", response_model=ReportJobResponse)
async def get_report_job(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check the status and JSON payload of a generated report job."""
    job = await ReportingService.get_report_job(
        db=db,
        organization_id=current_user.organization_id,
        job_id=id,
    )
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report job {id} not found",
        )
    return ReportJobResponse.model_validate(job)


@router.get("/{id}/download")
async def download_report_file(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download generated artifact file (PDF, JSON, CSV, XLSX)."""
    job = await ReportingService.get_report_job(
        db=db,
        organization_id=current_user.organization_id,
        job_id=id,
    )
    if not job or not job.file_path or not os.path.exists(job.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report artifact for job {id} not available or not yet compiled",
        )

    await AuditService.log(
        db=db,
        user=current_user,
        action=AuditAction.REPORT_DOWNLOADED,
        resource_type="ReportJob",
        resource_id=str(job.id),
        metadata={"file_path": job.file_path, "format": job.report_format.value},
    )

    media_type = "application/json" if job.report_format == ReportFormat.JSON else "text/csv" if job.report_format == ReportFormat.CSV else "application/pdf"
    return FileResponse(
        path=job.file_path,
        media_type=media_type,
        filename=os.path.basename(job.file_path),
    )

