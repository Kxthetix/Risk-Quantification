"""Trends and historical snapshots API router (Phase 9)."""
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.trends import (
    DashboardSnapshotCreate,
    DashboardSnapshotResponse,
    FinancialTrendResponse,
    NewRisksResponse,
    RegressionsResponse,
    RiskReductionTrendResponse,
    RiskTrendResponse,
)
from app.services.trend_service import TrendService

router = APIRouter(prefix="/trends", tags=["Risk Trends & Snapshots"])


@router.get("/risk", response_model=RiskTrendResponse)
async def get_risk_trend(
    period: str = Query("30d", description="Time window for trend"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical risk score trend and directional velocity."""
    return await TrendService.get_risk_trend(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
    )


@router.get("/financial", response_model=FinancialTrendResponse)
async def get_financial_trend(
    period: str = Query("30d", description="Time window for loss trend"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve historical financial loss trajectory (Expected Loss, P50, P90, P95)."""
    return await TrendService.get_financial_trend(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
    )


@router.get("/risk-reduction", response_model=RiskReductionTrendResponse)
async def get_risk_reduction_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track risk and financial reduction achieved across completed remediations."""
    return await TrendService.get_risk_reduction_trend(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/new-risks", response_model=NewRisksResponse)
async def get_new_risks(
    period_days: int = Query(14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect newly introduced critical vulnerabilities and exposure points."""
    return await TrendService.get_new_risks(
        db=db,
        organization_id=current_user.organization_id,
        period_days=period_days,
    )


@router.get("/regressions", response_model=RegressionsResponse)
async def get_regressions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Detect posture regressions, risk score increases, and SLA breaches."""
    return await TrendService.get_regressions(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.post("/snapshots", response_model=DashboardSnapshotResponse, status_code=status.HTTP_201_CREATED)
async def create_snapshot(
    payload: Optional[DashboardSnapshotCreate] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually capture and persist a risk & financial snapshot."""
    snap = await TrendService.create_daily_snapshot(
        db=db,
        organization_id=current_user.organization_id,
    )
    return DashboardSnapshotResponse.model_validate(snap)
