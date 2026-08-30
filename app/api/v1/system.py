"""System diagnostics and operational status API router (Phase 10)."""
from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.core.health import get_system_status
from app.models.user import User

router = APIRouter(prefix="/system", tags=["System Diagnostics"])


@router.get(
    "/status",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="System Operational Status",
    description="Returns high-level system diagnostics and dependency health. Restricted to Admin users only.",
)
async def system_status(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """Provide safe diagnostics without leaking secrets or credentials."""
    return await get_system_status(db)
