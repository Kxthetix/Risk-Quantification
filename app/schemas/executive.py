"""Executive Dashboard, Risk Analytics & Financial Risk Schemas (Phase 11)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. Shared / Common
# ─────────────────────────────────────────────────────────────────────────────

class DataFreshness(BaseModel):
    last_updated: Optional[datetime] = None
    calculation_time: Optional[datetime] = None
    data_coverage_pct: float = Field(default=100.0)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Cyber Risk
# ─────────────────────────────────────────────────────────────────────────────

class RiskScoreCard(BaseModel):
    current_score: float
    previous_score: Optional[float] = None
    change: Optional[float] = None
    level: str  # Critical / High / Medium / Low / Minimal
    last_updated: Optional[datetime] = None


class RiskTrendPoint(BaseModel):
    timestamp: datetime
    cyber_risk: float
    financial_risk: Optional[float] = None
    operational_risk: Optional[float] = None
    compliance_risk: Optional[float] = None


class RiskTrendResponse(BaseModel):
    period_days: int
    points: List[RiskTrendPoint]
    freshness: Optional[DataFreshness] = None


class RiskDriver(BaseModel):
    driver: str  # Threat, Vulnerability, Asset, Control, Incident, etc.
    contribution: float  # percentage 0-100
    delta: Optional[float] = None
    description: Optional[str] = None


class RiskDriverResponse(BaseModel):
    total_risk: float
    drivers: List[RiskDriver]
    period_days: int


class RiskAttributionItem(BaseModel):
    category: str
    label: str
    risk_score: float
    financial_exposure: Optional[float] = None
    count: int = 0


class RiskAttributionResponse(BaseModel):
    threat_contribution: List[RiskAttributionItem]
    vulnerability_contribution: List[RiskAttributionItem]
    asset_contribution: List[RiskAttributionItem]
    control_contribution: List[RiskAttributionItem]


# ─────────────────────────────────────────────────────────────────────────────
# 3. Financial Risk
# ─────────────────────────────────────────────────────────────────────────────

class ExecutiveFinancialRiskResponse(BaseModel):
    current_exposure: float
    potential_loss: float
    expected_annual_loss: float
    annualized_risk: float
    downtime_exposure: float
    recovery_cost: float
    response_cost: float
    compliance_exposure: float
    currency: str = "USD"
    freshness: Optional[DataFreshness] = None


class FinancialTrendPoint(BaseModel):
    timestamp: datetime
    potential_loss: float
    expected_loss: float
    actual_loss: Optional[float] = None
    risk_reduction: Optional[float] = None


class FinancialTrendResponse(BaseModel):
    period_days: int
    points: List[FinancialTrendPoint]


class LossPercentile(BaseModel):
    percentile: str  # P10, P25, P50, P75, P90, P95, P99
    value: float
    probability: float


class LossDistributionResponse(BaseModel):
    percentiles: List[LossPercentile]
    mean: float
    median: float
    std_dev: float
    histogram_buckets: List[Dict[str, Any]] = Field(default_factory=list)


class FinancialAttributionItem(BaseModel):
    category: str  # Downtime, Data Loss, Recovery, etc.
    amount: float
    percentage: float


class FinancialAttributionResponse(BaseModel):
    total: float
    items: List[FinancialAttributionItem]


# ─────────────────────────────────────────────────────────────────────────────
# 4. Business Services
# ─────────────────────────────────────────────────────────────────────────────

class BusinessServiceRiskItem(BaseModel):
    service_id: UUID
    name: str
    criticality: str
    risk_score: float
    financial_exposure: float
    incident_count: int
    attack_path_count: int


class BusinessServiceRiskResponse(BaseModel):
    items: List[BusinessServiceRiskItem]
    total_exposure: float


# ─────────────────────────────────────────────────────────────────────────────
# 5. Asset Risk
# ─────────────────────────────────────────────────────────────────────────────

class AssetRiskSummaryItem(BaseModel):
    asset_id: UUID
    name: str
    asset_type: str
    criticality: str
    risk_score: float
    financial_exposure: float
    vulnerability_count: int
    incident_count: int
    attack_path_count: int


class AssetRiskSummaryResponse(BaseModel):
    items: List[AssetRiskSummaryItem]
    critical_assets: int
    high_risk_critical_assets: int
    assets_under_attack: int


class CriticalAssetDashboard(BaseModel):
    total_critical_assets: int
    high_risk_critical_assets: int
    assets_under_attack: int
    assets_with_exploitable_vulns: int
    assets_with_active_incidents: int


# ─────────────────────────────────────────────────────────────────────────────
# 6. Business Unit Risk
# ─────────────────────────────────────────────────────────────────────────────

class BusinessUnitRiskItem(BaseModel):
    unit_id: str
    name: str
    asset_count: int
    critical_asset_count: int
    risk_score: float
    financial_exposure: float
    incident_count: int
    compliance_risk: float


class BusinessUnitRiskResponse(BaseModel):
    items: List[BusinessUnitRiskItem]


# ─────────────────────────────────────────────────────────────────────────────
# 7. Top Risks
# ─────────────────────────────────────────────────────────────────────────────

class ExecutiveTopRiskItem(BaseModel):
    risk_id: UUID
    title: str
    category: str
    asset_name: Optional[str] = None
    business_service: Optional[str] = None
    likelihood: float
    impact: float
    financial_exposure: float
    risk_score: float
    status: str
    level: str


class ExecutiveTopRisksResponse(BaseModel):
    items: List[ExecutiveTopRiskItem]
    total_count: int


# ─────────────────────────────────────────────────────────────────────────────
# 8. Risk Register
# ─────────────────────────────────────────────────────────────────────────────

class RiskRegisterItem(BaseModel):
    risk_id: UUID
    risk_ref: str  # e.g. RSK-0042
    title: str
    category: str
    owner: Optional[str] = None
    business_owner: Optional[str] = None
    likelihood: float
    impact: float
    risk_score: float
    financial_impact: float
    treatment: str  # Accept / Mitigate / Transfer / Avoid
    status: str
    review_date: Optional[datetime] = None


class RiskRegisterResponse(BaseModel):
    items: List[RiskRegisterItem]
    total: int
    page: int
    page_size: int


# ─────────────────────────────────────────────────────────────────────────────
# 9. Risk Acceptance
# ─────────────────────────────────────────────────────────────────────────────

class RiskAcceptanceCreate(BaseModel):
    risk_id: UUID
    reason: str
    business_justification: str
    acceptance_duration_days: int = Field(ge=1, le=730)
    approver_id: UUID
    expiration_date: Optional[datetime] = None


class RiskAcceptanceResponse(BaseModel):
    id: UUID
    risk_id: UUID
    status: str  # PENDING / APPROVED / REJECTED / EXPIRED
    reason: str
    business_justification: str
    acceptance_duration_days: int
    requested_by: str
    approver_id: UUID
    created_at: datetime
    expires_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None


class RiskAcceptanceReviewRequest(BaseModel):
    notes: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 10. Residual Risk & Reduction
# ─────────────────────────────────────────────────────────────────────────────

class ResidualRiskResponse(BaseModel):
    inherent_risk: float
    control_effectiveness_pct: float
    residual_risk: float


class RiskReductionResponse(BaseModel):
    initial_risk: float
    current_risk: float
    risk_reduced: float
    initial_financial_exposure: float
    current_financial_exposure: float
    financial_reduced: float
    period_days: int


# ─────────────────────────────────────────────────────────────────────────────
# 11. Recommendations
# ─────────────────────────────────────────────────────────────────────────────

class RecommendationItem(BaseModel):
    id: UUID
    title: str
    reason: str
    risk_impact: float
    financial_impact: float
    priority: str  # Critical / High / Medium / Low
    estimated_cost: Optional[float] = None
    expected_risk_reduction: float
    expected_financial_benefit: Optional[float] = None
    owner: Optional[str] = None
    affected_assets: List[str] = Field(default_factory=list)
    affected_services: List[str] = Field(default_factory=list)


class RecommendationsResponse(BaseModel):
    items: List[RecommendationItem]
    total: int


# ─────────────────────────────────────────────────────────────────────────────
# 12. Security Investments
# ─────────────────────────────────────────────────────────────────────────────

class SecurityInvestmentItem(BaseModel):
    investment_id: UUID
    name: str
    cost: float
    risk_before: float
    risk_after: float
    risk_reduction_pct: float
    financial_exposure_before: float
    financial_exposure_after: float
    estimated_loss_avoided: float
    roi_multiplier: float
    payback_months: Optional[float] = None


class SecurityInvestmentResponse(BaseModel):
    items: List[SecurityInvestmentItem]
    total_investment: float
    total_risk_reduction_pct: float
    total_loss_avoided: float


# ─────────────────────────────────────────────────────────────────────────────
# 13. Scenarios (What-If)
# ─────────────────────────────────────────────────────────────────────────────

class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str  # remediation / control / investment / asset_change / risk_treatment
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ScenarioResultState(BaseModel):
    risk_score: float
    financial_exposure: float
    expected_loss: float
    risk_reduction_pct: float
    investment_cost: Optional[float] = None
    roi: Optional[float] = None


class ScenarioResult(BaseModel):
    id: UUID
    name: str
    status: str  # queued / running / completed / failed
    current_state: Optional[ScenarioResultState] = None
    projected_state: Optional[ScenarioResultState] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class ScenarioComparisonResponse(BaseModel):
    current: ScenarioResultState
    scenarios: List[ScenarioResult]


# ─────────────────────────────────────────────────────────────────────────────
# 14. Control Effectiveness
# ─────────────────────────────────────────────────────────────────────────────

class ControlEffectivenessItem(BaseModel):
    control_id: UUID
    name: str
    category: str
    coverage_pct: float
    effectiveness_pct: float
    assets_protected: int
    risks_reduced: int
    failures: int
    exceptions: int
    status: str  # Effective / Partially Effective / Ineffective / Unknown


class ControlEffectivenessResponse(BaseModel):
    items: List[ControlEffectivenessItem]
    overall_effectiveness_pct: float
    effective_count: int
    partial_count: int
    ineffective_count: int


# ─────────────────────────────────────────────────────────────────────────────
# 15. Compliance Risk
# ─────────────────────────────────────────────────────────────────────────────

class ComplianceRiskFramework(BaseModel):
    framework_id: str
    name: str
    compliance_pct: float
    open_gaps: int
    critical_gaps: int
    risk_score: float


class ComplianceRiskResponse(BaseModel):
    overall_compliance_risk: float
    critical_gaps: int
    open_findings: int
    high_risk_controls: int
    compliance_exposure: float
    frameworks: List[ComplianceRiskFramework]


# ─────────────────────────────────────────────────────────────────────────────
# 16. Vulnerability Risk
# ─────────────────────────────────────────────────────────────────────────────

class VulnerabilityRiskResponse(BaseModel):
    critical_vulnerabilities: int
    exploitable_vulnerabilities: int
    internet_facing_vulnerabilities: int
    unpatched_critical_assets: int
    financial_exposure: float
    trend_points: List[Dict[str, Any]] = Field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# 17. Threat Risk
# ─────────────────────────────────────────────────────────────────────────────

class ThreatRiskResponse(BaseModel):
    critical_threats: int
    active_threat_actors: int
    active_campaigns: int
    ioc_matches: int
    threat_exposure: float
    threat_driven_financial_risk: float


# ─────────────────────────────────────────────────────────────────────────────
# 18. Incident Risk & Cost
# ─────────────────────────────────────────────────────────────────────────────

class IncidentCostAnalysis(BaseModel):
    detection_cost: float
    investigation_cost: float
    response_cost: float
    recovery_cost: float
    downtime_cost: float
    total_estimated_cost: float


class IncidentRiskResponse(BaseModel):
    open_incidents: int
    critical_incidents: int
    incident_financial_exposure: float
    avg_response_time_hours: float
    risk_from_incidents: float
    cost_analysis: IncidentCostAnalysis


# ─────────────────────────────────────────────────────────────────────────────
# 19. Attack Path Risk
# ─────────────────────────────────────────────────────────────────────────────

class AttackPathRiskResponse(BaseModel):
    critical_attack_paths: int
    high_risk_attack_paths: int
    assets_exposed: int
    business_services_exposed: int
    financial_exposure: float


# ─────────────────────────────────────────────────────────────────────────────
# 20. Executive Summary
# ─────────────────────────────────────────────────────────────────────────────

class ExecutiveSummaryResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    current_risk: float
    risk_change: float
    risk_level: str
    financial_exposure: float
    major_incidents: List[Dict[str, Any]]
    top_threats: List[str]
    major_vulnerabilities: List[str]
    risk_reduction: float
    recommended_actions: List[str]
    narrative: Optional[str] = None
    generated_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# 21. Forecast
# ─────────────────────────────────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    timestamp: datetime
    projected_risk: float
    projected_financial_exposure: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    is_projection: bool = False


class ForecastScenarioResult(BaseModel):
    label: str  # No Remediation / Partial / Full
    projected_risk: float
    projected_loss: float
    investment: float
    risk_reduction_pct: float


class ForecastResponse(BaseModel):
    forecast_period_days: int
    historical: List[ForecastPoint]
    projected: List[ForecastPoint]
    scenarios: List[ForecastScenarioResult]
    confidence_pct: float
    freshness: Optional[DataFreshness] = None


# ─────────────────────────────────────────────────────────────────────────────
# 22. Executive Dashboard (Aggregated)
# ─────────────────────────────────────────────────────────────────────────────

class ExecutiveDashboardResponse(BaseModel):
    risk_score: RiskScoreCard
    financial: ExecutiveFinancialRiskResponse
    critical_risks: int
    critical_assets: int
    open_incidents: int
    risk_reduction_pct: float
    compliance_risk: float
    attack_paths: AttackPathRiskResponse
    top_recommendations: List[RecommendationItem]
    freshness: DataFreshness


class ExecutiveKPIResponse(BaseModel):
    kpi_key: str
    label: str
    value: Any
    previous_value: Optional[Any] = None
    unit: str = ""
    change: Optional[float] = None
    trend: Optional[str] = None  # up / down / stable
    drill_down_url: Optional[str] = None
    level: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 23. Report Schemas (extended)
# ─────────────────────────────────────────────────────────────────────────────

class ReportScheduleCreate(BaseModel):
    report_id: Optional[UUID] = None
    report_name: str
    report_type: str
    frequency: str  # daily / weekly / monthly / quarterly
    recipients: List[str]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)


class ReportScheduleUpdate(BaseModel):
    frequency: Optional[str] = None
    recipients: Optional[List[str]] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None


class ReportScheduleResponse(BaseModel):
    id: UUID
    report_name: str
    report_type: str
    frequency: str
    recipients: List[str]
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    last_sent: Optional[datetime] = None
    next_scheduled: Optional[datetime] = None
    status: str
    created_at: datetime


class ReportHistoryItem(BaseModel):
    id: UUID
    report_name: str
    report_type: str
    generated_by: str
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    status: str
    format: str
    created_at: datetime


class ReportHistoryResponse(BaseModel):
    items: List[ReportHistoryItem]
    total: int
    page: int
    page_size: int
