"""Software API router — CRUD for standalone software records."""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.user import User, UserRole
from app.schemas.software import (
    SoftwareCreate,
    SoftwareListResponse,
    SoftwarePatch,
    SoftwareResponse,
    SoftwareUpdate,
)
from app.services.software_service import software_service

router = APIRouter(prefix="/software", tags=["Software"])


def _require_write_access(current_user: User) -> None:
    """SECURITY_ANALYST and above can manage software records."""
    if not current_user.role.has_permission(UserRole.SECURITY_ANALYST):
        raise AuthorizationError(
            message="Managing software records requires SECURITY_ANALYST role or above.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )


@router.post(
    "",
    response_model=SoftwareResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Software",
    description="Create a new software record. Vendor, product name, and version form a unique identity per organization.",
)
async def create_software(
    payload: SoftwareCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoftwareResponse:
    _require_write_access(current_user)
    sw = await software_service.create(db, payload, current_user)
    return SoftwareResponse.model_validate(sw)


@router.get(
    "",
    response_model=SoftwareListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Software",
    description="List all software records for the organization with optional vendor/product filters.",
)
async def list_software(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    vendor: Optional[str] = Query(None, description="Filter by vendor name"),
    product_name: Optional[str] = Query(None, description="Filter by product name"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoftwareListResponse:
    items, total = await software_service.list_software(
        db,
        current_user.organization_id,
        page=page,
        limit=limit,
        vendor=vendor,
        product_name=product_name,
    )
    return SoftwareListResponse(
        items=[SoftwareResponse.model_validate(s) for s in items],
        page=page,
        limit=limit,
        total=total,
    )


@router.get(
    "/{software_id}",
    response_model=SoftwareResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Software",
    description="Retrieve details for a specific software record.",
)
async def get_software(
    software_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoftwareResponse:
    sw = await software_service.get_by_id(db, software_id, current_user.organization_id)
    return SoftwareResponse.model_validate(sw)


@router.put(
    "/{software_id}",
    response_model=SoftwareResponse,
    status_code=status.HTTP_200_OK,
    summary="Replace Software (Full Update)",
    description="Fully replace a software record's properties.",
)
async def update_software(
    software_id: uuid.UUID,
    payload: SoftwareUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoftwareResponse:
    _require_write_access(current_user)
    sw = await software_service.update(db, software_id, payload, current_user)
    return SoftwareResponse.model_validate(sw)


@router.patch(
    "/{software_id}",
    response_model=SoftwareResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially Update Software",
    description="Update specific fields of a software record.",
)
async def patch_software(
    software_id: uuid.UUID,
    payload: SoftwarePatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SoftwareResponse:
    _require_write_access(current_user)
    sw = await software_service.patch(db, software_id, payload, current_user)
    return SoftwareResponse.model_validate(sw)


@router.delete(
    "/{software_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Software",
    description="Delete a software record. Only removes the global record, not individual asset links.",
)
async def delete_software(
    software_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    _require_write_access(current_user)
    await software_service.delete(db, software_id, current_user)
