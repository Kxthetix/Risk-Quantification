"""Security Monitoring & Real-Time Event Ingestion API endpoints (Phase 9)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.monitoring import (
    DataSourceHealthItem,
    MonitoringDashboardResponse,
    MonitoringHealthResponse,
    SecurityEventDetailResponse,
    SecurityEventItem,
    SecurityEventsListResponse,
)
from app.services.monitoring_service import monitoring_service

router = APIRouter(prefix="/monitoring", tags=["Security Monitoring"])


@router.get("/dashboard", response_model=MonitoringDashboardResponse, summary="Get Security Monitoring Dashboard KPIs")
async def get_monitoring_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitoringDashboardResponse:
    return await monitoring_service.get_dashboard(db, current_user.organization_id)


@router.get("/events", response_model=SecurityEventsListResponse, summary="List & Filter Real-Time Security Events")
async def list_security_events(
    severity: Optional[str] = Query(None, description="CRITICAL, HIGH, MEDIUM, LOW"),
    event_type: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    asset_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SecurityEventsListResponse:
    return await monitoring_service.get_events(
        db,
        current_user.organization_id,
        severity=severity,
        event_type=event_type,
        source=source,
        asset_id=asset_id,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/events/{event_id}", response_model=SecurityEventDetailResponse, summary="Get Security Event Deep Inspection")
async def get_security_event_detail(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SecurityEventDetailResponse:
    return await monitoring_service.get_event_by_id(db, current_user.organization_id, event_id)


@router.get("/data-sources", response_model=List[DataSourceHealthItem], summary="List Connected Data Sources & Health")
async def list_data_sources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[DataSourceHealthItem]:
    return await monitoring_service.get_data_sources(db, current_user.organization_id)


@router.get("/health", response_model=MonitoringHealthResponse, summary="Get Monitoring Ingestion & Engine Health")
async def get_monitoring_health(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MonitoringHealthResponse:
    return await monitoring_service.get_health(db, current_user.organization_id)
