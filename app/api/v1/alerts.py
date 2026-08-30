"""Alerts Management API endpoints (Phase 9)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.alerts import (
    AlertAssignRequest,
    AlertCorrelationGroupItem,
    AlertDetailResponse,
    AlertEscalateRequest,
    AlertFalsePositiveRequest,
    AlertResolveRequest,
    AlertSummaryResponse,
    DetailedAlertItem,
)
from app.services.alert_management_service import alert_management_service

router = APIRouter(prefix="/alerts-management", tags=["Alerts Management"])


@router.get("/summary", response_model=AlertSummaryResponse, summary="Get Alerts Executive KPIs")
async def get_alerts_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertSummaryResponse:
    return await alert_management_service.get_summary(db, current_user.organization_id)


@router.get("/", response_model=List[DetailedAlertItem], summary="List & Filter Alerts")
async def list_alerts(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    asset_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DetailedAlertItem]:
    return await alert_management_service.get_alerts(
        db, current_user.organization_id, severity=severity, status=status_filter, asset_id=asset_id
    )


@router.get("/correlations", response_model=List[AlertCorrelationGroupItem], summary="Get Correlated Alert Clusters")
async def get_alert_correlations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[AlertCorrelationGroupItem]:
    return await alert_management_service.get_correlation_groups(db, current_user.organization_id)


@router.get("/{alert_id}", response_model=AlertDetailResponse, summary="Get Alert Deep Inspection")
async def get_alert_detail(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AlertDetailResponse:
    return await alert_management_service.get_alert_by_id(db, current_user.organization_id, alert_id)


@router.post("/{alert_id}/assign", response_model=DetailedAlertItem, summary="Assign Alert to Responder")
async def assign_alert(
    alert_id: str,
    payload: AlertAssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetailedAlertItem:
    return await alert_management_service.assign_alert(db, current_user.organization_id, alert_id, payload)


@router.post("/{alert_id}/resolve", response_model=DetailedAlertItem, summary="Resolve Alert with Notes")
async def resolve_alert(
    alert_id: str,
    payload: AlertResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetailedAlertItem:
    return await alert_management_service.resolve_alert(db, current_user.organization_id, alert_id, payload)


@router.post("/{alert_id}/false-positive", response_model=DetailedAlertItem, summary="Mark Alert as False Positive")
async def mark_alert_false_positive(
    alert_id: str,
    payload: AlertFalsePositiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DetailedAlertItem:
    return await alert_management_service.mark_false_positive(db, current_user.organization_id, alert_id, payload)
