from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import (
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserSessionResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user & organization",
    description="Registers a new user and provisions an organization. The user becomes the primary organization admin.",
)
async def register(
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    user = await auth_service.register(db, payload)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    description="Authenticates user credentials and returns a signed JWT access token and refresh token.",
)
async def login(
    payload: UserLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    device_info = request.headers.get("User-Agent")
    forwarded = request.headers.get("X-Forwarded-For")
    ip_address = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)

    _, token_response = await auth_service.authenticate(
        db=db,
        login_in=payload,
        device_info=device_info,
        ip_address=ip_address,
    )
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh Access Token",
    description="Rotates refresh token and issues a new access/refresh token pair.",
)
async def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    device_info = request.headers.get("User-Agent")
    forwarded = request.headers.get("X-Forwarded-For")
    ip_address = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else None)

    return await auth_service.refresh_access_token(
        db=db,
        refresh_token_str=payload.refresh_token,
        device_info=device_info,
        ip_address=ip_address,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Revokes active refresh token and invalidates user session.",
)
async def logout(
    payload: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    refresh_str = payload.refresh_token if payload else None
    await auth_service.logout(db, current_user.id, refresh_str)
    return {"message": "Successfully logged out and session revoked."}


@router.get(
    "/sessions",
    response_model=List[UserSessionResponse],
    status_code=status.HTTP_200_OK,
    summary="List Active User Sessions",
    description="Lists active and past login sessions for the authenticated user.",
)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[UserSessionResponse]:
    sessions = await auth_service.list_sessions(db, current_user.id)
    return [UserSessionResponse.model_validate(s) for s in sessions]


@router.delete(
    "/sessions/{id}",
    status_code=status.HTTP_200_OK,
    summary="Revoke Session",
    description="Explicitly revokes a specific user session / refresh token.",
)
async def revoke_session(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await auth_service.revoke_session(db, current_user.id, id)
    return {"message": f"Session {id} successfully revoked."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Retrieves the profile of the currently authenticated user using Bearer JWT.",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)
