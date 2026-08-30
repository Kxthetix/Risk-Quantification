"""Analytics, Alerts, and Compliance API router (Phase 9)."""
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.enums import AlertSeverity, AlertType, ComplianceFramework
from app.models.user import User
from app.schemas.analytics import (
    AlertAcknowledgeRequest,
    AlertCreate,
    AlertResponse,
    AlertsListResponse,
    ComplianceFrameworkResponse,
    ComplianceGapResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(tags=["Analytics, Alerts & Compliance"])


# ---------------------------------------------------------------------------
# Alerts Endpoints
# ---------------------------------------------------------------------------
@router.get("/alerts", response_model=AlertsListResponse)
async def list_alerts(
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgement state"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List organizational security and financial risk alerts."""
    return await AnalyticsService.get_alerts(
        db=db,
        organization_id=current_user.organization_id,
        severity=severity,
        acknowledged=acknowledged,
        page=page,
        page_size=page_size,
    )


@router.post("/alerts", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a new security or risk alert."""
    alert = await AnalyticsService.create_alert(
        db=db,
        organization_id=current_user.organization_id,
        payload=payload,
    )
    return AlertResponse.model_validate(alert)


@router.post("/alerts/{id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    id: uuid.UUID,
    payload: Optional[AlertAcknowledgeRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Acknowledge an active alert."""
    try:
        alert = await AnalyticsService.acknowledge_alert(
            db=db,
            organization_id=current_user.organization_id,
            alert_id=id,
            current_user=current_user,
        )
        return AlertResponse.model_validate(alert)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ---------------------------------------------------------------------------
# Compliance Endpoints
# ---------------------------------------------------------------------------
@router.get("/compliance/frameworks", response_model=List[str])
async def list_compliance_frameworks(
    current_user: User = Depends(get_current_user),
):
    """List supported regulatory and cybersecurity compliance frameworks."""
    return ["ISO/IEC 27001", "NIST CSF", "CIS Controls"]


@router.get("/compliance/{framework:path}/gaps", response_model=ComplianceGapResponse)
async def get_compliance_gaps(
    framework: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get missing controls and requirement gaps for a specific compliance framework."""
    return await AnalyticsService.get_compliance_gaps(
        db=db,
        organization_id=current_user.organization_id,
        framework_name=framework,
    )


@router.get("/compliance/{framework:path}", response_model=ComplianceFrameworkResponse)
async def get_compliance_framework(
    framework: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Evaluate compliance coverage and requirement mappings for a specific framework."""
    return await AnalyticsService.get_compliance_framework(
        db=db,
        organization_id=current_user.organization_id,
        framework_name=framework,
    )
