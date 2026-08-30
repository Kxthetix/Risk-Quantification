"""Pydantic schemas for Report Generation and Executive Documents (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ReportFormat, ReportStatus, ReportType
from app.schemas.dashboard import DashboardMeta


class ReportGenerateRequest(BaseModel):
    """Request payload to initiate asynchronous report compilation."""
    report_type: ReportType = Field(default=ReportType.EXECUTIVE_RISK)
    period: str = Field(default="30d", description="Analytical period: 7d, 30d, 90d, 6m, 1y")
    format: ReportFormat = Field(default=ReportFormat.JSON, description="Output format: PDF, JSON, CSV, XLSX")


class ReportJobResponse(BaseModel):
    """Status metadata for report generation background job."""
    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    report_type: ReportType
    period: str
    report_format: ReportFormat
    status: ReportStatus
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ExecutiveSummarySection(BaseModel):
    risk_direction: str
    risk_change: float
    financial_exposure_change: float
    critical_findings_change: int
    top_priority: str
    key_takeaways: List[str]


class MethodologySection(BaseModel):
    risk_model_version: str = "v1.2.0-Contextual"
    financial_model_version: str = "v1.1.0-MonteCarlo-LogNormal"
    optimization_model_version: str = "v1.0.0-0/1-Knapsack-DP"
    simulation_count: int = 10000
    data_timestamp: datetime = Field(default_factory=datetime.utcnow)
    confidence: float = 0.90
    major_assumptions: List[str] = Field(
        default_factory=lambda: [
            "Financial risk modeled probabilistically via Monte Carlo simulations.",
            "Estimates represent expected distributions, not guaranteed losses.",
            "Defensive control effectiveness calculated using threat-specific attenuation parameters.",
        ]
    )


class ExecutiveReportDocument(BaseModel):
    """Complete 12-section structured document data."""
    title: str = "Executive Cybersecurity Risk & Financial Impact Report"
    organization_name: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    period: str

    section_1_executive_summary: ExecutiveSummarySection
    section_2_overall_cyber_risk: Dict[str, Any]
    section_3_financial_risk: Dict[str, Any]
    section_4_top_business_risks: List[Dict[str, Any]]
    section_5_critical_attack_paths: List[Dict[str, Any]]
    section_6_top_vulnerabilities: List[Dict[str, Any]]
    section_7_remediation_status: Dict[str, Any]
    section_8_security_investment: Dict[str, Any]
    section_9_risk_reduction: Dict[str, Any]
    section_10_recommended_actions: List[Dict[str, Any]]
    section_11_risk_trend: Dict[str, Any]
    section_12_methodology: MethodologySection

    meta: DashboardMeta = Field(default_factory=DashboardMeta)
