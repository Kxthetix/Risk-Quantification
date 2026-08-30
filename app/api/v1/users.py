from typing import List
import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import (
    get_current_user,
    require_admin,
    require_manager,
    verify_organization_access,
)
from app.core.exceptions import AuthorizationError
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List Organization Users",
    description="Retrieves a list of all users within the authenticated user's organization.",
)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[UserResponse]:
    users = await user_service.list_by_organization(
        db,
        organization_id=current_user.organization_id,
        skip=skip,
        limit=limit,
    )
    return [UserResponse.model_validate(u) for u in users]


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get User by ID",
    description="Retrieves details for a user within the same organization.",
)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    target_user = await user_service.get_by_id(db, user_id)
    verify_organization_access(target_user.organization_id, current_user)
    return UserResponse.model_validate(target_user)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create User in Organization",
    description="Provisions a new user directly inside the administrator's organization.",
)
async def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await user_service.create(
        db,
        user_in=payload,
        organization_id=current_user.organization_id,
    )
    return UserResponse.model_validate(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User Details",
    description="Modifies a user's details or role. Requires ADMIN privilege.",
)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    target_user = await user_service.get_by_id(db, user_id)
    verify_organization_access(target_user.organization_id, current_user)
    
    updated_user = await user_service.update(db, user_id, payload)
    return UserResponse.model_validate(updated_user)
