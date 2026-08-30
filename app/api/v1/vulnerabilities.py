"""Vulnerability Intelligence API router — CVE search, filtering, statistics, NVD sync, and matching engine."""
from datetime import datetime
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError, BadRequestError
from app.models.enums import ExploitAvailability, VulnerabilitySeverity
from app.models.user import User, UserRole
from app.schemas.vulnerability import (
    SyncJobResponse,
    SyncTriggerResponse,
    VulnerabilityDetailResponse,
    VulnerabilityListResponse,
    VulnerabilityMatchRequest,
    VulnerabilityMatchResponse,
    VulnerabilityResponse,
    VulnerabilityStatisticsResponse,
)
from app.services.vulnerability_matching_service import vulnerability_matching_service
from app.services.vulnerability_service import vulnerability_service
from app.services.vulnerability_sync_service import vulnerability_sync_service
from app.workers.vulnerability_sync_worker import dispatch_sync_task

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])


def _require_analyst_or_admin(current_user: User) -> None:
    if not current_user.role.has_permission(UserRole.SECURITY_ANALYST):
        raise AuthorizationError(
            message="This action requires SECURITY_ANALYST role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


# ---------------------------------------------------------------------------
# NVD Synchronization Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/sync",
    response_model=SyncJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger NVD Vulnerability Synchronization",
    description="Asynchronously start pulling latest CVEs and CVSS metrics from the National Vulnerability Database.",
)
async def trigger_nvd_sync(
    max_records: int = Query(100, ge=1, le=2000, description="Max CVE records to fetch in this batch"),
    cve_id: Optional[str] = Query(None, description="Optional specific CVE ID to sync immediately"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SyncJobResponse:
    _require_analyst_or_admin(current_user)
    job = await vulnerability_sync_service.create_job(db, current_user)
    # Dispatch background worker task
    dispatch_sync_task(job_id=job.id, max_records=max_records, cve_id=cve_id)

    return SyncJobResponse(
        job_id=job.id,
        status=job.status,
        started_at=job.started_at,
        completed_at=job.completed_at,
        records_processed=job.records_processed,
        records_added=job.records_added,
        records_updated=job.records_updated,
        records_failed=job.records_failed,
        last_sync_timestamp=job.last_sync_timestamp,
        error_message=job.error_message,
    )


@router.get(
    "/sync/{job_id}",
    response_model=SyncJobResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Synchronization Job Status",
    description="Check the execution progress and records processed of an asynchronous sync job.",
)
async def get_sync_job_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SyncJobResponse:
    job = await vulnerability_sync_service.get_job(db, job_id)
    return SyncJobResponse(
        job_id=job.id,
        status=job.status,
        started_at=job.started_at,
        completed_at=job.completed_at,
        records_processed=job.records_processed,
        records_added=job.records_added,
        records_updated=job.records_updated,
        records_failed=job.records_failed,
        last_sync_timestamp=job.last_sync_timestamp,
        error_message=job.error_message,
    )


# ---------------------------------------------------------------------------
# Vulnerability Matching Engine Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/match",
    response_model=VulnerabilityMatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Trigger Vulnerability Matching Engine",
    description=(
        "Correlate installed software inventory against the vulnerability database. "
        "Can target a specific asset or run organization-wide."
    ),
)
async def match_vulnerabilities(
    payload: Optional[VulnerabilityMatchRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VulnerabilityMatchResponse:
    _require_analyst_or_admin(current_user)
    asset_id = payload.asset_id if payload else None

    if asset_id:
        assets_proc, sw_proc, matches = await vulnerability_matching_service.match_asset(
            db, asset_id, current_user
        )
    else:
        assets_proc, sw_proc, matches = await vulnerability_matching_service.match_organization(
            db, current_user
        )

    return VulnerabilityMatchResponse(
        assets_processed=assets_proc,
        software_processed=sw_proc,
        matches_found=matches,
    )


# ---------------------------------------------------------------------------
# Vulnerability Statistics Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/statistics",
    response_model=VulnerabilityStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Vulnerability Dashboard Statistics",
    description="Retrieve global CVE counts and organization-scoped exposure metrics.",
)
async def get_vulnerability_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VulnerabilityStatisticsResponse:
    stats = await vulnerability_service.get_statistics(db, current_user.organization_id)
    return VulnerabilityStatisticsResponse(**stats)


# ---------------------------------------------------------------------------
# Vulnerability Search Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/search",
    response_model=VulnerabilityListResponse,
    status_code=status.HTTP_200_OK,
    summary="Search Vulnerabilities",
    description="Free-text substring search across CVE ID, description, and primary CWE.",
)
async def search_vulnerabilities(
    q: str = Query(..., min_length=1, description="Search term or CVE query string"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VulnerabilityListResponse:
    items, total = await vulnerability_service.search_vulnerabilities(
        db, q, page=page, limit=limit
    )
    return VulnerabilityListResponse(
        items=[VulnerabilityResponse.model_validate(v) for v in items],
        page=page,
        limit=limit,
        total=total,
    )


# ---------------------------------------------------------------------------
# List Vulnerabilities with Filters
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=VulnerabilityListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Vulnerabilities",
    description="Retrieve a paginated collection of CVEs with multi-attribute filtering.",
)
async def list_vulnerabilities(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[VulnerabilitySeverity] = Query(None, description="Filter by severity"),
    cvss_min: Optional[float] = Query(None, ge=0.0, le=10.0, description="Minimum CVSS base score"),
    cvss_max: Optional[float] = Query(None, ge=0.0, le=10.0, description="Maximum CVSS base score"),
    published_after: Optional[datetime] = Query(None, description="Filter published on or after timestamp"),
    published_before: Optional[datetime] = Query(None, description="Filter published on or before timestamp"),
    known_exploited: Optional[bool] = Query(None, description="Filter by known exploitation status (e.g. CISA KEV)"),
    exploit_available: Optional[ExploitAvailability] = Query(None, description="Filter by public exploit availability"),
    cwe_id: Optional[str] = Query(None, description="Filter by primary CWE ID (e.g. 'CWE-79')"),
    vendor: Optional[str] = Query(None, description="Filter by affected software vendor"),
    product: Optional[str] = Query(None, description="Filter by affected software product"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VulnerabilityListResponse:
    items, total = await vulnerability_service.list_vulnerabilities(
        db,
        page=page,
        limit=limit,
        severity=severity,
        cvss_min=cvss_min,
        cvss_max=cvss_max,
        published_after=published_after,
        published_before=published_before,
        known_exploited=known_exploited,
        exploit_available=exploit_available,
        cwe_id=cwe_id,
        vendor=vendor,
        product=product,
    )
    return VulnerabilityListResponse(
        items=[VulnerabilityResponse.model_validate(v) for v in items],
        page=page,
        limit=limit,
        total=total,
    )


# ---------------------------------------------------------------------------
# Get Vulnerability Detail
# ---------------------------------------------------------------------------

@router.get(
    "/{cve_id}",
    response_model=VulnerabilityDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Vulnerability Detail",
    description="Retrieve normalized details, CVSS vector breakdown, affected CPEs, and CWEs for a CVE.",
)
async def get_vulnerability_detail(
    cve_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VulnerabilityDetailResponse:
    vuln = await vulnerability_service.get_by_cve_id(db, cve_id)

    # Format affected CPEs
    cpe_list = [
        {
            "cpe_string": link.cpe.cpe_string if link.cpe else (link.criteria or ""),
            "vulnerable": link.vulnerable,
            "criteria": link.criteria,
            "version_start_including": link.version_start_including,
            "version_start_excluding": link.version_start_excluding,
            "version_end_including": link.version_end_including,
            "version_end_excluding": link.version_end_excluding,
        }
        for link in vuln.vulnerability_cpes
        if link.cpe or link.criteria
    ]

    cwe_list = [
        {"cwe_id": c.cwe_id, "name": c.name, "description": c.description}
        for c in vuln.cwes
    ]

    resp_dict = VulnerabilityResponse.model_validate(vuln).model_dump()
    resp_dict["affected_cpes"] = cpe_list
    resp_dict["cwes"] = cwe_list

    return VulnerabilityDetailResponse(**resp_dict)
