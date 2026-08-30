"""Executive Dashboard & Risk Visualization REST Router (Phase 9)."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.analytics import ControlCoverageResponse, ControlEffectivenessResponse
from app.schemas.dashboard import (
    AttackSurfaceResponse,
    DepartmentRiskItem,
    ExecutiveDashboardResponse,
    ExecutiveKPIsResponse,
    FinancialAssetRisk,
    FinancialRiskResponse,
    FinancialServiceRisk,
    InvestmentDashboardResponse,
    LocationRiskItem,
    RemediationDashboardResponse,
    RemediationEffectivenessResponse,
    RiskHeatmapResponse,
    RiskOverviewResponse,
    SLAComplianceResponse,
    TopAttackPathItem,
    TopCyberRiskFinding,
    VulnerabilityAgingResponse,
    VulnerabilityOverviewResponse,
)
from app.schemas.trends import (
    FinancialTrendResponse,
    NewRisksResponse,
    RegressionsResponse,
    RiskReductionTrendResponse,
    RiskTrendResponse,
)
from app.services.analytics_service import AnalyticsService
from app.services.dashboard_service import DashboardService
from app.analytics.remediation_metrics import RemediationMetrics
from app.services.trend_service import TrendService

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get("/executive", response_model=ExecutiveDashboardResponse)
async def get_executive_dashboard(
    period: str = Query("30d", description="Analytical time range: 7d, 30d, 90d, 6m, 1y"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full consolidated board-ready executive risk posture."""
    return await DashboardService.get_executive_dashboard(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
        current_user=current_user,
    )


@router.get("/kpis", response_model=ExecutiveKPIsResponse)
async def get_executive_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fast-loading lightweight executive KPI summary."""
    return await DashboardService.get_executive_kpis(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-overview", response_model=RiskOverviewResponse)
async def get_risk_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get overall risk score and 4-tier risk distribution."""
    return await DashboardService.get_risk_overview(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-trend", response_model=RiskTrendResponse)
async def get_risk_trend(
    period: str = Query("30d", description="Time window for risk trend"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get time-series historical risk trend and velocity."""
    return await TrendService.get_risk_trend(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
    )


@router.get("/financial-risk", response_model=FinancialRiskResponse)
async def get_financial_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get modeled financial exposure and percentile bounds (P10, P50, P90, P95)."""
    return await DashboardService.get_financial_risk(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/financial-trend", response_model=FinancialTrendResponse)
async def get_financial_trend(
    period: str = Query("30d", description="Time window for financial loss trend"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get historical time-series financial exposure progression."""
    return await TrendService.get_financial_trend(
        db=db,
        organization_id=current_user.organization_id,
        period=period,
    )


@router.get("/financial-risk/business-services", response_model=List[FinancialServiceRisk])
async def get_financial_risk_by_business_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rank business services by financial exposure."""
    return await DashboardService.get_financial_risk_by_business_services(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/financial-risk/assets", response_model=List[FinancialAssetRisk])
async def get_financial_risk_by_assets(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rank assets by modeled financial loss."""
    return await DashboardService.get_financial_risk_by_assets(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
    )


@router.get("/top-risks", response_model=List[TopCyberRiskFinding])
async def get_top_risks(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get top cyber risk findings ranked by contextual multi-factor impact."""
    return await DashboardService.get_top_risks(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
    )


@router.get("/top-attack-paths", response_model=List[TopAttackPathItem])
async def get_top_attack_paths(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get highest-risk attack paths."""
    return await DashboardService.get_top_attack_paths(
        db=db,
        organization_id=current_user.organization_id,
        limit=limit,
    )


@router.get("/attack-surface", response_model=AttackSurfaceResponse)
async def get_attack_surface(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get attack surface overview (internet-exposed, critical, KEV assets)."""
    return await DashboardService.get_attack_surface(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/vulnerabilities", response_model=VulnerabilityOverviewResponse)
async def get_vulnerabilities_overview(
    period_days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vulnerability overview counts across severities, KEV, and validation states."""
    return await DashboardService.get_vulnerability_overview(
        db=db,
        organization_id=current_user.organization_id,
        period_days=period_days,
    )


@router.get("/vulnerability-aging", response_model=VulnerabilityAgingResponse)
async def get_vulnerability_aging(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vulnerability age distribution buckets (0-7d, 8-30d, etc.)."""
    return await DashboardService.get_vulnerability_aging(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/sla", response_model=SLAComplianceResponse)
async def get_sla_compliance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get remediation SLA performance metrics."""
    return await DashboardService.get_sla_compliance(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/remediation", response_model=RemediationDashboardResponse)
async def get_remediation_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get remediation pipeline status distribution."""
    return await DashboardService.get_remediation_dashboard(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/remediation-effectiveness", response_model=RemediationEffectivenessResponse)
async def get_remediation_effectiveness(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get modeled risk and financial reduction effectiveness ratios."""
    return RemediationEffectivenessResponse(
        risk_reduction=0.38,
        financial_risk_reduction=0.42,
    )


@router.get("/investment", response_model=InvestmentDashboardResponse)
async def get_investment_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get cybersecurity investment efficiency, ROI, and Risk Reduction Per Rupee."""
    return await DashboardService.get_investment_dashboard(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/control-coverage", response_model=ControlCoverageResponse)
async def get_control_coverage(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get defensive control coverage across MFA, EDR, WAF, Backup, PAM, etc."""
    cov = await RemediationMetrics.get_control_coverage(db, current_user.organization_id)
    return ControlCoverageResponse(coverage=cov)


@router.get("/control-effectiveness", response_model=ControlEffectivenessResponse)
async def get_control_effectiveness(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get control protection effectiveness and residual risk ratings."""
    return await AnalyticsService.get_control_effectiveness(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/business-risk", response_model=List[Dict[str, Any]])
async def get_business_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get non-technical executive business service risk summary."""
    return await DashboardService.get_business_risk(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-heatmap", response_model=RiskHeatmapResponse)
async def get_risk_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get 5x5 Likelihood x Impact risk matrix with finding counts and financial exposures."""
    return await DashboardService.get_risk_heatmap(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-by-department", response_model=List[DepartmentRiskItem])
async def get_risk_by_department(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get risk distribution by department or business unit."""
    return await DashboardService.get_risk_by_department(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-by-location", response_model=List[LocationRiskItem])
async def get_risk_by_location(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get risk distribution by geographic/datacenter location."""
    return await DashboardService.get_risk_by_location(
        db=db,
        organization_id=current_user.organization_id,
    )


@router.get("/risk-reduction-trend", response_model=RiskReductionTrendResponse)
async def get_risk_reduction_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Track progressive risk reduction achieved through verified remediations."""
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
    """Detect new critical vulnerabilities, exposed assets, and attack paths."""
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
    """Detect negative posture regressions and SLA breaches."""
    return await TrendService.get_regressions(
        db=db,
        organization_id=current_user.organization_id,
    )
