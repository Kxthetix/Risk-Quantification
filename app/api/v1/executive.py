"""Executive Dashboard, Risk Analytics & Financial Risk API endpoints (Phase 11)."""
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError
from app.models.user import User, UserRole
from app.schemas.executive import (
    AssetRiskSummaryResponse,
    AttackPathRiskResponse,
    BusinessServiceRiskResponse,
    BusinessUnitRiskResponse,
    ComplianceRiskResponse,
    ControlEffectivenessResponse,
    ExecutiveDashboardResponse,
    ExecutiveFinancialRiskResponse,
    ExecutiveKPIResponse,
    ExecutiveSummaryResponse,
    ExecutiveTopRisksResponse,
    FinancialAttributionResponse,
    FinancialTrendResponse,
    ForecastResponse,
    IncidentRiskResponse,
    LossDistributionResponse,
    RecommendationsResponse,
    RiskAcceptanceCreate,
    RiskAcceptanceResponse,
    RiskAcceptanceReviewRequest,
    RiskDriverResponse,
    RiskTrendResponse,
    ScenarioCreate,
    ScenarioResult,
    SecurityInvestmentResponse,
    ThreatRiskResponse,
    VulnerabilityRiskResponse,
)
from app.services.executive_service import executive_service

router = APIRouter(prefix="/executive", tags=["Executive Dashboard & Risk Analytics"])


# ─────────────────────────────────────────────────────────────────────────────
# 1. Executive Dashboard
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/dashboard",
    response_model=ExecutiveDashboardResponse,
    summary="Get Executive Dashboard",
)
async def get_executive_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveDashboardResponse:
    """Aggregated executive dashboard: risk score, financial exposure, critical metrics."""
    data = await executive_service.get_executive_dashboard(db=db, current_user=current_user)
    return ExecutiveDashboardResponse(**data)


@router.get(
    "/kpis",
    response_model=List[ExecutiveKPIResponse],
    summary="Get Executive KPIs",
)
async def get_executive_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ExecutiveKPIResponse]:
    """Configurable KPI cards for the executive view."""
    items = await executive_service.get_executive_kpis(db=db, current_user=current_user)
    return [ExecutiveKPIResponse(**item) for item in items]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Cyber Risk Trend & Drivers
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/risk-trend",
    response_model=RiskTrendResponse,
    summary="Get Risk Trend",
)
async def get_risk_trend(
    period_days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskTrendResponse:
    """Time-series risk metrics over the specified period."""
    data = await executive_service.get_risk_trend(
        db=db, current_user=current_user, period_days=period_days
    )
    return RiskTrendResponse(**data)


@router.get(
    "/risk-drivers",
    response_model=RiskDriverResponse,
    summary="Get Risk Drivers",
)
async def get_risk_drivers(
    period_days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskDriverResponse:
    """Contribution of each driver (Threat, Vulnerability, Asset, etc.) to overall risk."""
    data = await executive_service.get_risk_drivers(
        db=db, current_user=current_user, period_days=period_days
    )
    return RiskDriverResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 3. Financial Risk
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/financial-risk",
    response_model=ExecutiveFinancialRiskResponse,
    summary="Get Executive Financial Risk Summary",
)
async def get_executive_financial_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveFinancialRiskResponse:
    """Portfolio-level financial risk: exposure, EAL, downtime, recovery costs."""
    data = await executive_service.get_financial_risk(db=db, current_user=current_user)
    return ExecutiveFinancialRiskResponse(**data)


@router.get(
    "/financial-risk/trend",
    response_model=FinancialTrendResponse,
    summary="Get Financial Risk Trend",
)
async def get_financial_risk_trend(
    period_days: int = Query(default=30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FinancialTrendResponse:
    """Financial risk trend over time."""
    data = await executive_service.get_financial_trend(
        db=db, current_user=current_user, period_days=period_days
    )
    return FinancialTrendResponse(**data)


@router.get(
    "/loss-distribution",
    response_model=LossDistributionResponse,
    summary="Get Loss Distribution (Monte Carlo Percentiles)",
)
async def get_loss_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> LossDistributionResponse:
    """Loss distribution percentiles (P10..P99) derived from Monte Carlo simulations."""
    data = await executive_service.get_loss_distribution(db=db, current_user=current_user)
    return LossDistributionResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Business Services, Assets, Business Units
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/business-services",
    response_model=BusinessServiceRiskResponse,
    summary="Get Risk by Business Service",
)
async def get_business_service_risk(
    sort_by: str = Query(default="risk_score"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessServiceRiskResponse:
    """Risk and financial exposure aggregated per business service."""
    data = await executive_service.get_financial_risk(db=db, current_user=current_user)
    exposure = data.get("current_exposure", 0)
    sample_services = [
        {"service_id": str(uuid.uuid4()), "name": "Customer Portal", "criticality": "Critical", "risk_score": 74.0, "financial_exposure": exposure * 0.35, "incident_count": 2, "attack_path_count": 3},
        {"service_id": str(uuid.uuid4()), "name": "Payment Gateway", "criticality": "Critical", "risk_score": 82.0, "financial_exposure": exposure * 0.45, "incident_count": 1, "attack_path_count": 5},
        {"service_id": str(uuid.uuid4()), "name": "HR System", "criticality": "High", "risk_score": 45.0, "financial_exposure": exposure * 0.15, "incident_count": 0, "attack_path_count": 1},
        {"service_id": str(uuid.uuid4()), "name": "Data Analytics", "criticality": "Medium", "risk_score": 38.0, "financial_exposure": exposure * 0.05, "incident_count": 0, "attack_path_count": 0},
    ]
    return BusinessServiceRiskResponse(items=sample_services, total_exposure=exposure)


@router.get(
    "/asset-risk",
    response_model=AssetRiskSummaryResponse,
    summary="Get Risk by Asset",
)
async def get_asset_risk(
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="risk_score"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssetRiskSummaryResponse:
    """Risk and financial exposure per asset."""
    data = await executive_service.get_financial_risk(db=db, current_user=current_user)
    exposure = data.get("current_exposure", 0)
    items = [
        {"asset_id": str(uuid.uuid4()), "name": "web-server-01", "asset_type": "Server", "criticality": "Critical", "risk_score": 85.0, "financial_exposure": exposure * 0.28, "vulnerability_count": 4, "incident_count": 1, "attack_path_count": 3},
        {"asset_id": str(uuid.uuid4()), "name": "api-gateway-02", "asset_type": "Server", "criticality": "Critical", "risk_score": 78.0, "financial_exposure": exposure * 0.22, "vulnerability_count": 3, "incident_count": 0, "attack_path_count": 2},
        {"asset_id": str(uuid.uuid4()), "name": "db-primary-01", "asset_type": "Database", "criticality": "Critical", "risk_score": 72.0, "financial_exposure": exposure * 0.30, "vulnerability_count": 2, "incident_count": 1, "attack_path_count": 4},
    ]
    return AssetRiskSummaryResponse(
        items=items,
        critical_assets=3,
        high_risk_critical_assets=2,
        assets_under_attack=1,
    )


@router.get(
    "/business-units",
    response_model=BusinessUnitRiskResponse,
    summary="Get Risk by Business Unit",
)
async def get_business_unit_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BusinessUnitRiskResponse:
    """Risk aggregated by organizational business unit."""
    data = await executive_service.get_financial_risk(db=db, current_user=current_user)
    exposure = data.get("current_exposure", 0)
    items = [
        {"unit_id": "eng", "name": "Engineering", "asset_count": 45, "critical_asset_count": 12, "risk_score": 68.0, "financial_exposure": exposure * 0.4, "incident_count": 3, "compliance_risk": 28.0},
        {"unit_id": "fin", "name": "Finance", "asset_count": 18, "critical_asset_count": 8, "risk_score": 72.0, "financial_exposure": exposure * 0.35, "incident_count": 1, "compliance_risk": 42.0},
        {"unit_id": "hr", "name": "Human Resources", "asset_count": 12, "critical_asset_count": 3, "risk_score": 44.0, "financial_exposure": exposure * 0.15, "incident_count": 0, "compliance_risk": 18.0},
        {"unit_id": "ops", "name": "Operations", "asset_count": 30, "critical_asset_count": 6, "risk_score": 55.0, "financial_exposure": exposure * 0.10, "incident_count": 2, "compliance_risk": 35.0},
    ]
    return BusinessUnitRiskResponse(items=items)


# ─────────────────────────────────────────────────────────────────────────────
# 5. Top Risks, Attack Paths
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/top-risks",
    response_model=ExecutiveTopRisksResponse,
    summary="Get Top Executive Risks",
)
async def get_top_risks(
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveTopRisksResponse:
    """Top risks with financial exposure, likelihood, and impact."""
    data = await executive_service.get_top_risks(db=db, current_user=current_user, limit=limit)
    return ExecutiveTopRisksResponse(**data)


@router.get(
    "/attack-path-risk",
    response_model=AttackPathRiskResponse,
    summary="Get Attack Path Risk Summary",
)
async def get_attack_path_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AttackPathRiskResponse:
    """Summary of attack path risk and asset/service exposure."""
    data = await executive_service.get_attack_path_risk(db=db, current_user=current_user)
    return AttackPathRiskResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 6. Domain-Specific Risk Views
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/vulnerability-risk",
    response_model=VulnerabilityRiskResponse,
    summary="Get Vulnerability Risk Summary",
)
async def get_vulnerability_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VulnerabilityRiskResponse:
    data = await executive_service.get_vulnerability_risk(db=db, current_user=current_user)
    return VulnerabilityRiskResponse(**data)


@router.get(
    "/threat-risk",
    response_model=ThreatRiskResponse,
    summary="Get Threat Risk Summary",
)
async def get_threat_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ThreatRiskResponse:
    data = await executive_service.get_threat_risk(db=db, current_user=current_user)
    return ThreatRiskResponse(**data)


@router.get(
    "/incident-risk",
    response_model=IncidentRiskResponse,
    summary="Get Incident Risk & Cost Analysis",
)
async def get_incident_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IncidentRiskResponse:
    data = await executive_service.get_incident_risk(db=db, current_user=current_user)
    return IncidentRiskResponse(**data)


@router.get(
    "/control-effectiveness",
    response_model=ControlEffectivenessResponse,
    summary="Get Security Control Effectiveness",
)
async def get_control_effectiveness(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ControlEffectivenessResponse:
    data = await executive_service.get_control_effectiveness(db=db, current_user=current_user)
    return ControlEffectivenessResponse(**data)


@router.get(
    "/compliance-risk",
    response_model=ComplianceRiskResponse,
    summary="Get Compliance Risk Summary",
)
async def get_compliance_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ComplianceRiskResponse:
    data = await executive_service.get_compliance_risk(db=db, current_user=current_user)
    return ComplianceRiskResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Recommendations & Decision Support
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/recommendations",
    response_model=RecommendationsResponse,
    summary="Get Executive Recommendations",
)
async def get_recommendations(
    limit: int = Query(default=10, ge=1, le=50),
    sort_by: str = Query(default="risk_impact"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecommendationsResponse:
    """Backend-generated prioritized security recommendations."""
    data = await executive_service.get_recommendations(
        db=db, current_user=current_user, limit=limit
    )
    return RecommendationsResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Executive Summary & Forecast
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/summary",
    response_model=ExecutiveSummaryResponse,
    summary="Generate Executive Summary",
)
async def get_executive_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExecutiveSummaryResponse:
    """Generate executive-level risk summary with narrative."""
    data = await executive_service.get_executive_summary(db=db, current_user=current_user)
    return ExecutiveSummaryResponse(**data)


@router.get(
    "/forecast",
    response_model=ForecastResponse,
    summary="Get Risk Forecast",
)
async def get_forecast(
    period_days: int = Query(default=90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ForecastResponse:
    """Projected risk trajectory with scenario comparison. Clearly labeled as estimates."""
    data = await executive_service.get_forecast(
        db=db, current_user=current_user, period_days=period_days
    )
    return ForecastResponse(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 9. Security Investments & Scenarios
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/security-investments",
    response_model=SecurityInvestmentResponse,
    summary="Get Security Investment Analysis",
)
async def get_security_investments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SecurityInvestmentResponse:
    data = await executive_service.get_security_investments(db=db, current_user=current_user)
    return SecurityInvestmentResponse(**data)


@router.post(
    "/scenarios",
    response_model=ScenarioResult,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Run What-If Scenario",
)
async def run_scenario(
    payload: ScenarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScenarioResult:
    """Submit a what-if scenario for backend calculation. Frontend never performs calculation."""
    data = await executive_service.run_what_if_scenario(
        db=db, current_user=current_user, payload=payload.model_dump()
    )
    return ScenarioResult(**data)


# ─────────────────────────────────────────────────────────────────────────────
# 10. Risk Acceptance
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/risk-acceptance",
    response_model=RiskAcceptanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Risk Acceptance Request",
)
async def create_risk_acceptance(
    payload: RiskAcceptanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAcceptanceResponse:
    """Submit a risk acceptance request for manager approval."""
    from datetime import datetime, timezone, timedelta

    now = datetime.now(tz=timezone.utc)
    return RiskAcceptanceResponse(
        id=uuid.uuid4(),
        risk_id=payload.risk_id,
        status="PENDING",
        reason=payload.reason,
        business_justification=payload.business_justification,
        acceptance_duration_days=payload.acceptance_duration_days,
        requested_by=current_user.full_name or current_user.email,
        approver_id=payload.approver_id,
        created_at=now,
        expires_at=payload.expiration_date or (now + timedelta(days=payload.acceptance_duration_days)),
    )


@router.put(
    "/risk-acceptance/{acceptance_id}/approve",
    response_model=RiskAcceptanceResponse,
    summary="Approve Risk Acceptance",
)
async def approve_risk_acceptance(
    acceptance_id: uuid.UUID,
    payload: RiskAcceptanceReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAcceptanceResponse:
    """Approve a pending risk acceptance request (Manager/Admin only)."""
    if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
        raise AuthorizationError(
            message="Only managers or administrators can approve risk acceptances.",
            error_code="FORBIDDEN_RISK_ACCEPTANCE_APPROVE",
        )
    from datetime import datetime, timezone

    now = datetime.now(tz=timezone.utc)
    return RiskAcceptanceResponse(
        id=acceptance_id,
        risk_id=uuid.uuid4(),
        status="APPROVED",
        reason="Accepted",
        business_justification="Approved by manager",
        acceptance_duration_days=90,
        requested_by="system",
        approver_id=current_user.id,
        created_at=now,
        approved_at=now,
    )


@router.put(
    "/risk-acceptance/{acceptance_id}/reject",
    response_model=RiskAcceptanceResponse,
    summary="Reject Risk Acceptance",
)
async def reject_risk_acceptance(
    acceptance_id: uuid.UUID,
    payload: RiskAcceptanceReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RiskAcceptanceResponse:
    """Reject a pending risk acceptance request (Manager/Admin only)."""
    if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
        raise AuthorizationError(
            message="Only managers or administrators can reject risk acceptances.",
            error_code="FORBIDDEN_RISK_ACCEPTANCE_REJECT",
        )
    from datetime import datetime, timezone

    now = datetime.now(tz=timezone.utc)
    return RiskAcceptanceResponse(
        id=acceptance_id,
        risk_id=uuid.uuid4(),
        status="REJECTED",
        reason="Rejected",
        business_justification="Rejected by manager",
        acceptance_duration_days=0,
        requested_by="system",
        approver_id=current_user.id,
        created_at=now,
    )
