"""Pydantic schemas for Executive Dashboard & Risk Visualizations (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field

from app.models.enums import RiskLevel, TrendDirection


class DashboardMeta(BaseModel):
    """Metadata detailing timestamp, provenance, and analytical confidence."""
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    data_as_of: datetime = Field(default_factory=datetime.utcnow)
    model_version: str = Field(default="1.0")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)


class ExecutiveDashboardResponse(BaseModel):
    """Board-ready C-level consolidated risk posture summary."""
    overall_risk_score: float = Field(..., description="Overall cyber risk score (0-100)")
    risk_level: str = Field(..., description="Qualitative risk classification (CRITICAL, HIGH, MEDIUM, LOW)")
    expected_annual_loss: float = Field(..., description="Modeled expected annual loss in INR")
    p50_loss: float = Field(..., description="Median modeled loss (P50)")
    p90_loss: float = Field(..., description="90th percentile modeled loss (P90)")
    p95_loss: Optional[float] = Field(None, description="95th percentile modeled loss (P95)")
    critical_assets: int = Field(..., description="Number of critical assets")
    critical_vulnerabilities: int = Field(..., description="Number of open critical vulnerabilities")
    critical_attack_paths: int = Field(..., description="Number of critical attack paths")
    open_remediations: int = Field(..., description="Total open remediation actions")
    overdue_remediations: int = Field(..., description="Remediation actions past SLA")
    risk_reduction_potential: float = Field(..., description="Fractional risk reduction potential (0.0 to 1.0)")
    security_investment: float = Field(..., description="Total defensive cybersecurity investment")
    modeled_risk_reduction: float = Field(..., description="Expected financial loss reduction from security investments")
    risk_trend: TrendDirection = Field(..., description="Direction of risk trend (IMPROVING, WORSENING, STABLE)")
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class ExecutiveKPIsResponse(BaseModel):
    """Lightweight summary KPI response optimized for instant page loads."""
    overall_risk_score: float
    expected_annual_loss: float
    critical_findings: int
    critical_attack_paths: int
    open_remediations: int
    overdue_remediations: int
    risk_reduction_potential: float
    security_investment: float
    roi: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class RiskDistribution(BaseModel):
    critical: int
    high: int
    medium: int
    low: int


class RiskOverviewResponse(BaseModel):
    score: float
    level: str
    distribution: RiskDistribution
    assessed_count: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class FinancialRiskResponse(BaseModel):
    expected_annual_loss: float
    p10: float
    p50: float
    p90: float
    p95: float
    maximum_modeled_loss: float
    currency: str = "INR"
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class FinancialServiceRisk(BaseModel):
    service_id: str
    service: str
    criticality: str
    expected_loss: float
    p90_loss: float


class FinancialAssetRisk(BaseModel):
    asset_id: str
    asset: str
    business_service: Optional[str]
    criticality: str
    risk_score: float
    expected_loss: float
    p90_loss: float


class TopCyberRiskFinding(BaseModel):
    finding_id: str
    asset: str
    cve_id: Optional[str]
    risk_score: float
    expected_loss: float
    attack_paths: int
    known_exploited: bool
    priority: str


class TopAttackPathItem(BaseModel):
    path_id: str
    entry_point: str
    target: str
    target_asset_name: Optional[str]
    path_length: int
    likelihood: float
    impact: float
    path_score: float
    financial_exposure: float


class AttackSurfaceResponse(BaseModel):
    total_assets: int
    internet_facing: int
    critical_assets: int
    known_exploited_assets: int
    assets_with_critical_vulns: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class VulnerabilityOverviewResponse(BaseModel):
    total: int
    critical: int
    high: int
    medium: int
    low: int
    known_exploited: int
    unvalidated: int
    validated: int
    overdue: int
    new_in_period: int
    resolved_in_period: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class VulnerabilityAgingResponse(BaseModel):
    buckets: Dict[str, int]
    average_age_days: float
    median_age_days: float
    oldest_open_vulnerability_days: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class SLAComplianceResponse(BaseModel):
    within_sla: int
    approaching_sla: int
    breached_sla: int
    resolved_within_sla: int
    average_remediation_time_hours: float
    compliance_rate: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class RemediationDashboardResponse(BaseModel):
    open: int
    planned: int
    in_progress: int
    completed: int
    verified: int
    accepted_risk: int
    overdue: int
    total_expected_loss_reduction: float
    total_remediation_cost: float
    average_remediation_time_hours: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class RemediationEffectivenessResponse(BaseModel):
    risk_reduction: float
    financial_risk_reduction: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class InvestmentDashboardResponse(BaseModel):
    total_security_investment: float
    one_time_cost: float
    recurring_cost: float
    expected_loss_reduction: float
    modeled_risk_reduction: float
    roi: float
    risk_reduction_per_rupee: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class HeatmapCellSchema(BaseModel):
    likelihood: int
    impact: int
    finding_count: int
    asset_count: int
    financial_exposure: float


class RiskHeatmapResponse(BaseModel):
    dimensions: Dict[str, int]
    cells: List[HeatmapCellSchema]
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class DepartmentRiskItem(BaseModel):
    department: str
    asset_count: int
    risk_score: float
    expected_loss: float
    critical_findings: int
    overdue_remediations: int


class LocationRiskItem(BaseModel):
    location: str
    assets: int
    risk: float
    expected_loss: float
    critical_vulnerabilities: int
