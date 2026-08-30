"""Assets API router — full CRUD, search, statistics, CSV import/export.

All endpoints are organization-scoped. The organization is determined
exclusively from the authenticated user's JWT — never from client payload.
"""
import io
from typing import List, Optional

import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_manager,
    require_security_analyst,
    require_viewer,
)
from app.core.exceptions import AuthorizationError, BadRequestError
from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    DataClassification,
)
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetCreate,
    AssetDetailResponse,
    AssetListResponse,
    AssetPatch,
    AssetResponse,
    AssetStatisticsResponse,
    AssetUpdate,
    ImportResultResponse,
)
from app.schemas.software import AssetSoftwareAttach, AssetSoftwareListResponse, AssetSoftwareResponse
from app.schemas.vulnerability import (
    AssetVulnerabilityListResponse,
    AssetVulnerabilityPatch,
    AssetVulnerabilityResponse,
)
from app.services.asset_service import asset_service
from app.services.software_service import software_service

router = APIRouter(prefix="/assets", tags=["Assets"])


# ---------------------------------------------------------------------------
# Helper: RBAC for write operations
# ---------------------------------------------------------------------------

def _require_write_access(current_user: User) -> None:
    """SECURITY_ANALYST and above can create/update/delete assets."""
    if not current_user.role.has_permission(UserRole.SECURITY_ANALYST):
        raise AuthorizationError(
            message="Creating, modifying, or deleting assets requires SECURITY_ANALYST role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


def _require_manage_access(current_user: User) -> None:
    """MANAGER and above can update assets (but not delete)."""
    if not current_user.role.has_permission(UserRole.MANAGER):
        raise AuthorizationError(
            message="Updating assets requires MANAGER role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


# ---------------------------------------------------------------------------
# Statistics (defined BEFORE {asset_id} route to avoid routing conflict)
# ---------------------------------------------------------------------------

@router.get(
    "/statistics",
    response_model=AssetStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Asset Inventory Statistics",
    description="Returns aggregate statistics for the organization's asset inventory.",
)
async def get_asset_statistics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetStatisticsResponse:
    return await asset_service.get_statistics(db, current_user.organization_id)


# ---------------------------------------------------------------------------
# Search (defined BEFORE {asset_id} route)
# ---------------------------------------------------------------------------

@router.get(
    "/search",
    response_model=AssetListResponse,
    status_code=status.HTTP_200_OK,
    summary="Search Assets",
    description="Full-text search across asset name, hostname, IP address, description, and owner.",
)
async def search_assets(
    q: str = Query(..., min_length=1, description="Search query string"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetListResponse:
    items, total = await asset_service.search_assets(
        db,
        current_user.organization_id,
        query=q,
        page=page,
        limit=limit,
    )
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in items],
        page=page,
        limit=limit,
        total=total,
    )


# ---------------------------------------------------------------------------
# CSV Import (defined BEFORE {asset_id} route)
# ---------------------------------------------------------------------------

@router.post(
    "/import",
    response_model=ImportResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Import Assets from CSV",
    description=(
        "Upload a CSV file to bulk-import assets. "
        "Required columns: name, asset_type, criticality, environment. "
        "File size limited to 10 MB. Never execute uploaded content."
    ),
)
async def import_assets_csv(
    file: UploadFile = File(..., description="CSV file containing asset inventory"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResultResponse:
    _require_write_access(current_user)

    # Security: validate content type without trusting filename
    if file.content_type not in ("text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"):
        raise BadRequestError(
            message="Only CSV files are accepted. Please upload a .csv file.",
            error_code="INVALID_FILE_TYPE",
        )

    content = await file.read()
    try:
        result = await asset_service.import_csv(db, content, current_user, dry_run=False)
    except ValueError as exc:
        raise BadRequestError(
            message=str(exc),
            error_code="CSV_PARSE_ERROR",
        )
    return result


@router.post(
    "/import/validate",
    response_model=ImportResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate Asset CSV Import (Dry Run)",
    description="Validates a CSV asset import payload without committing changes to the database.",
)
async def validate_assets_csv(
    file: UploadFile = File(..., description="CSV file containing asset inventory to preview/validate"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResultResponse:
    _require_write_access(current_user)

    if file.content_type not in ("text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"):
        raise BadRequestError(
            message="Only CSV files are accepted. Please upload a .csv file.",
            error_code="INVALID_FILE_TYPE",
        )

    content = await file.read()
    try:
        result = await asset_service.import_csv(db, content, current_user, dry_run=True)
    except ValueError as exc:
        raise BadRequestError(
            message=str(exc),
            error_code="CSV_PARSE_ERROR",
        )
    return result


# ---------------------------------------------------------------------------
# CSV Export (defined BEFORE {asset_id} route)
# ---------------------------------------------------------------------------

@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export Assets to CSV",
    description="Download all assets belonging to the authenticated user's organization as a CSV file.",
)
async def export_assets_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    csv_content = await asset_service.export_csv(db, current_user)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=assets_export.csv"
        },
    )


# ---------------------------------------------------------------------------
# Create Asset
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Asset",
    description="Register a new asset in the organization's inventory.",
)
async def create_asset(
    payload: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetResponse:
    _require_write_access(current_user)
    asset = await asset_service.create(db, payload, current_user)
    return AssetResponse.model_validate(asset)


# ---------------------------------------------------------------------------
# List Assets
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=AssetListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Assets",
    description="Retrieve a paginated, filterable list of assets in the organization.",
)
async def list_assets(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    asset_type: Optional[AssetType] = Query(None, description="Filter by asset type"),
    criticality: Optional[AssetCriticality] = Query(None, description="Filter by criticality"),
    environment: Optional[AssetEnvironment] = Query(None, description="Filter by environment"),
    status: Optional[AssetStatus] = Query(None, description="Filter by status"),
    data_classification: Optional[DataClassification] = Query(None),
    internet_exposed: Optional[bool] = Query(None, description="Filter by internet exposure"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetListResponse:
    items, total = await asset_service.list_assets(
        db,
        current_user.organization_id,
        page=page,
        limit=limit,
        asset_type=asset_type,
        criticality=criticality,
        environment=environment,
        status=status,
        data_classification=data_classification,
        internet_exposed=internet_exposed,
    )
    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in items],
        page=page,
        limit=limit,
        total=total,
    )


# ---------------------------------------------------------------------------
# Get Asset Detail
# ---------------------------------------------------------------------------

@router.get(
    "/{asset_id}",
    response_model=AssetDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Asset Details",
    description="Retrieve full details for a specific asset including attached software inventory.",
)
async def get_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetDetailResponse:
    asset = await asset_service.get_by_id(db, asset_id, current_user.organization_id)
    software_list = await software_service.list_asset_software(
        db, asset_id, current_user.organization_id
    )
    response = AssetDetailResponse.model_validate(asset)
    response.software_count = len(software_list)
    response.software = software_list
    return response


# ---------------------------------------------------------------------------
# Update Asset (PUT)
# ---------------------------------------------------------------------------

@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
    status_code=status.HTTP_200_OK,
    summary="Replace Asset (Full Update)",
    description="Fully replace an asset's properties. Requires SECURITY_ANALYST or above.",
)
async def update_asset(
    asset_id: uuid.UUID,
    payload: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetResponse:
    _require_write_access(current_user)
    asset = await asset_service.update(db, asset_id, payload, current_user)
    return AssetResponse.model_validate(asset)


# ---------------------------------------------------------------------------
# Patch Asset (PATCH)
# ---------------------------------------------------------------------------

@router.patch(
    "/{asset_id}",
    response_model=AssetResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially Update Asset",
    description="Update specific asset fields. Requires MANAGER or above.",
)
async def patch_asset(
    asset_id: uuid.UUID,
    payload: AssetPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetResponse:
    _require_manage_access(current_user)
    asset = await asset_service.patch(db, asset_id, payload, current_user)
    return AssetResponse.model_validate(asset)


# ---------------------------------------------------------------------------
# Delete Asset
# ---------------------------------------------------------------------------

@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Asset",
    description="Permanently delete an asset and all its software relationships. Requires SECURITY_ANALYST or above.",
)
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    _require_write_access(current_user)
    await asset_service.delete(db, asset_id, current_user)


# ---------------------------------------------------------------------------
# Asset Software — Attach
# ---------------------------------------------------------------------------

@router.post(
    "/{asset_id}/software",
    response_model=AssetSoftwareResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Attach Software to Asset",
    description=(
        "Link a software package to an asset with installation-specific metadata. "
        "Both the asset and software must belong to the user's organization."
    ),
)
async def attach_software(
    asset_id: uuid.UUID,
    payload: AssetSoftwareAttach,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetSoftwareResponse:
    _require_write_access(current_user)
    link = await software_service.attach_to_asset(db, asset_id, payload, current_user)
    # Reload the full joint response
    results = await software_service.list_asset_software(db, asset_id, current_user.organization_id)
    for r in results:
        if r.id == link.id:
            return r
    raise HTTPException(status_code=500, detail="Failed to retrieve attached software.")


# ---------------------------------------------------------------------------
# Asset Software — List
# ---------------------------------------------------------------------------

@router.get(
    "/{asset_id}/software",
    response_model=AssetSoftwareListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Software on Asset",
    description="Retrieve all software packages installed on a specific asset.",
)
async def list_asset_software(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetSoftwareListResponse:
    software_list = await software_service.list_asset_software(
        db, asset_id, current_user.organization_id
    )
    return AssetSoftwareListResponse(
        asset_id=asset_id,
        software=software_list,
        total=len(software_list),
    )


# ---------------------------------------------------------------------------
# Asset Software — Detach
# ---------------------------------------------------------------------------

@router.delete(
    "/{asset_id}/software/{software_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Detach Software from Asset",
    description=(
        "Remove the relationship between a software package and an asset. "
        "The software record is NOT deleted — only the link is removed."
    ),
)
async def detach_software(
    asset_id: uuid.UUID,
    software_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    _require_write_access(current_user)
    await software_service.detach_from_asset(db, asset_id, software_id, current_user)


# ---------------------------------------------------------------------------
# Asset Vulnerabilities (Phase 3)
# ---------------------------------------------------------------------------

@router.get(
    "/{asset_id}/vulnerabilities",
    response_model=AssetVulnerabilityListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Asset Vulnerabilities",
    description="Retrieve all CVE vulnerabilities currently identified on this asset.",
)
async def list_asset_vulnerabilities(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetVulnerabilityListResponse:
    items = await asset_service.list_vulnerabilities(db, asset_id, current_user.organization_id)
    return AssetVulnerabilityListResponse(
        asset_id=asset_id,
        vulnerabilities=[AssetVulnerabilityResponse.model_validate(v) for v in items],
        total=len(items),
    )


@router.get(
    "/{asset_id}/vulnerabilities/{cve_id}",
    response_model=AssetVulnerabilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Asset Vulnerability Detail",
    description="Retrieve details of a specific CVE vulnerability detected on an asset.",
)
async def get_asset_vulnerability(
    asset_id: uuid.UUID,
    cve_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetVulnerabilityResponse:
    item = await asset_service.get_vulnerability(db, asset_id, cve_id, current_user.organization_id)
    return AssetVulnerabilityResponse.model_validate(item)


@router.patch(
    "/{asset_id}/vulnerabilities/{cve_id}",
    response_model=AssetVulnerabilityResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Asset Vulnerability Status",
    description="Update the lifecycle status (e.g. RESOLVED, ACCEPTED, FALSE_POSITIVE) or notes for an asset vulnerability.",
)
async def patch_asset_vulnerability(
    asset_id: uuid.UUID,
    cve_id: str,
    payload: AssetVulnerabilityPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AssetVulnerabilityResponse:
    if not current_user.role.has_permission(UserRole.MANAGER):
        raise AuthorizationError(
            message="Modifying vulnerability status requires MANAGER role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )
    item = await asset_service.patch_vulnerability(db, asset_id, cve_id, payload, current_user)
    return AssetVulnerabilityResponse.model_validate(item)


@router.delete(
    "/{asset_id}/vulnerabilities/{cve_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Dismiss Asset Vulnerability",
    description="Dismiss or remove a vulnerability association from an asset.",
)
async def delete_asset_vulnerability(
    asset_id: uuid.UUID,
    cve_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    _require_write_access(current_user)
    await asset_service.delete_vulnerability(db, asset_id, cve_id, current_user)

