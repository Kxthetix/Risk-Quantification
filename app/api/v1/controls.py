"""Defensive Security Controls API endpoints (Phase 8)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import ControlType
from app.models.user import User
from app.schemas.control import (
    ControlCreate,
    ControlEffectivenessCreate,
    ControlEffectivenessResponse,
    ControlResponse,
    ControlUpdate,
)
from app.services.control_service import control_service

router = APIRouter(prefix="/controls", tags=["Defensive Controls"])


@router.post(
    "",
    response_model=ControlResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a defensive security control",
)
async def create_control(
    payload: ControlCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlResponse:
    """Create and configure a defensive security control."""
    ctrl = await control_service.create_control(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
        current_user=current_user,
    )
    return ControlResponse.model_validate(ctrl)


@router.get(
    "",
    response_model=List[ControlResponse],
    summary="List defensive security controls",
)
async def list_controls(
    control_type: Optional[ControlType] = Query(None),
    enabled: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ControlResponse]:
    """List all defensive controls configured for the authenticated organization."""
    ctrls = await control_service.get_controls(
        db=db,
        organization_id=current_user.organization_id,
        control_type=control_type,
        enabled=enabled,
    )
    return [ControlResponse.model_validate(c) for c in ctrls]


@router.post(
    "/seed-defaults",
    response_model=List[ControlResponse],
    summary="Seed default enterprise baseline controls",
)
async def seed_defaults(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ControlResponse]:
    """Seed standard enterprise security controls (WAF, EDR, MFA, Micro-Segmentation)."""
    ctrls = await control_service.seed_default_controls_if_empty(
        db=db,
        organization_id=current_user.organization_id,
    )
    return [ControlResponse.model_validate(c) for c in ctrls]


@router.get(
    "/{control_id}",
    response_model=ControlResponse,
    summary="Get single defensive control",
)
async def get_control(
    control_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlResponse:
    """Fetch control details by ID."""
    ctrl = await control_service.get_control(
        db=db,
        organization_id=current_user.organization_id,
        control_id=control_id,
    )
    return ControlResponse.model_validate(ctrl)


@router.put(
    "/{control_id}",
    response_model=ControlResponse,
    summary="Update defensive control",
)
async def update_control(
    control_id: uuid.UUID,
    payload: ControlUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlResponse:
    """Update properties of an existing control."""
    ctrl = await control_service.update_control(
        db=db,
        organization_id=current_user.organization_id,
        control_id=control_id,
        payload=payload,
        current_user=current_user,
    )
    return ControlResponse.model_validate(ctrl)


@router.delete(
    "/{control_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete defensive control",
)
async def delete_control(
    control_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a defensive control."""
    await control_service.delete_control(
        db=db,
        organization_id=current_user.organization_id,
        control_id=control_id,
        current_user=current_user,
    )


@router.post(
    "/{control_id}/effectiveness",
    response_model=ControlEffectivenessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add targeted effectiveness mapping",
)
async def add_effectiveness(
    control_id: uuid.UUID,
    payload: ControlEffectivenessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlEffectivenessResponse:
    """Map empirical attenuation factor against a specific threat type and risk factor."""
    eff = await control_service.add_effectiveness_mapping(
        db=db,
        organization_id=current_user.organization_id,
        control_id=control_id,
        payload=payload,
        current_user=current_user,
    )
    return ControlEffectivenessResponse.model_validate(eff)
