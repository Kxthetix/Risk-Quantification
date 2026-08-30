import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_manager,
    verify_organization_access,
)
from app.core.exceptions import AuthorizationError
from app.models.user import User, UserRole
from app.schemas.organization import OrganizationResponse, OrganizationUpdate
from app.services.organization_service import organization_service

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get(
    "/me",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User's Organization Details",
    description="Retrieves the organization information for the currently authenticated user.",
)
async def get_my_organization(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    org = await organization_service.get_by_id(db, current_user.organization_id)
    return OrganizationResponse.model_validate(org)


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Organization Details",
    description="Retrieves organization information. Enforces organization-level data isolation.",
)
async def get_organization(
    organization_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    verify_organization_access(organization_id, current_user)
    org = await organization_service.get_by_id(db, organization_id)
    return OrganizationResponse.model_validate(org)


@router.put(
    "/{organization_id}",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Organization",
    description="Updates organization metadata. Requires MANAGER or ADMIN role within the organization.",
)
async def update_organization(
    organization_id: uuid.UUID,
    payload: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    verify_organization_access(organization_id, current_user)
    
    # Check permissions (MANAGER or ADMIN required to edit organization info)
    if not current_user.role.has_permission(UserRole.MANAGER):
        raise AuthorizationError(
            message="Only Managers or Admins can modify organization details.",
            error_code="INSUFFICIENT_PERMISSIONS",
        )

    org = await organization_service.update(db, organization_id, payload)
    return OrganizationResponse.model_validate(org)
