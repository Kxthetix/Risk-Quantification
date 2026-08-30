from collections.abc import Callable
import uuid
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.services.user_service import user_service

# HTTPBearer security scheme for OpenAPI docs
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT token from authorization header and retrieve User."""
    if not credentials or not credentials.credentials:
        raise AuthenticationError(
            message="Authorization token is missing. Please provide a Bearer token in the Authorization header.",
            error_code="TOKEN_MISSING",
        )

    token = credentials.credentials
    payload = decode_access_token(token)

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise AuthenticationError(
            message="Malformed token: missing subject claim.",
            error_code="TOKEN_MALFORMED",
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise AuthenticationError(
            message="Invalid user identifier format in token.",
            error_code="TOKEN_INVALID",
        )

    user = await user_service.get_by_id(db, user_uuid)
    if not user:
        raise AuthenticationError(
            message="User associated with this token does not exist.",
            error_code="USER_NOT_FOUND",
        )

    if not user.is_active:
        raise AuthenticationError(
            message="User account is deactivated.",
            error_code="INACTIVE_USER",
        )

    return user


def require_role(min_role: UserRole) -> Callable:
    """Dependency factory enforcing hierarchical RBAC."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not current_user.role.has_permission(min_role):
            raise AuthorizationError(
                message=f"Action requires at least '{min_role.value}' role. Your current role is '{current_user.role.value}'.",
                error_code="INSUFFICIENT_ROLE_PERMISSIONS",
            )
        return current_user

    return role_checker


# Convenient role shortcut dependencies
require_admin = require_role(UserRole.ADMIN)
require_security_analyst = require_role(UserRole.SECURITY_ANALYST)
require_manager = require_role(UserRole.MANAGER)
require_viewer = require_role(UserRole.VIEWER)

get_current_admin_user = require_admin
get_current_analyst_user = require_security_analyst


def verify_organization_access(
    requested_org_id: uuid.UUID,
    current_user: User,
) -> None:
    """Enforce strict organization-level multi-tenant data isolation."""
    if current_user.organization_id != requested_org_id:
        raise AuthorizationError(
            message="Access denied: You cannot access or modify data belonging to another organization.",
            error_code="ORGANIZATION_ISOLATION_VIOLATION",
        )
