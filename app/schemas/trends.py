"""Pydantic schemas for Time-series Trends, Snapshots, and Regression Detection (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import TrendDirection
from app.schemas.dashboard import DashboardMeta


class TimeSeriesPoint(BaseModel):
    date: str
    risk_score: float


class FinancialTrendPoint(BaseModel):
    date: str
    expected_loss: float
    p50_loss: float
    p90_loss: float
    p95_loss: float


class RiskReductionTrendPoint(BaseModel):
    date: str
    initial_risk: float
    current_risk: float
    risk_reduction: float
    financial_reduction: float
    remediations_completed: int


class RiskTrendResponse(BaseModel):
    points: List[TimeSeriesPoint]
    trend_direction: TrendDirection
    percentage_change: float
    absolute_change: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class FinancialTrendResponse(BaseModel):
    points: List[FinancialTrendPoint]
    trend_direction: TrendDirection
    percentage_change: float
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class RiskReductionTrendResponse(BaseModel):
    points: List[RiskReductionTrendPoint]
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class NewRiskItem(BaseModel):
    risk_type: str = Field(..., description="e.g. CRITICAL_VULNERABILITY, INTERNET_EXPOSURE, ATTACK_PATH")
    title: str
    description: str
    detected_at: datetime
    severity: str


class NewRisksResponse(BaseModel):
    items: List[NewRiskItem]
    total: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class RegressionItem(BaseModel):
    regression_type: str = Field(..., description="e.g. RISK_SCORE_INCREASE, FINANCIAL_EXPOSURE_INCREASE, CONTROL_COVERAGE_DROP")
    title: str
    description: str
    previous_value: float
    current_value: float
    detected_at: datetime


class RegressionsResponse(BaseModel):
    items: List[RegressionItem]
    total: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class DashboardSnapshotCreate(BaseModel):
    snapshot_date: Optional[datetime] = None


class DashboardSnapshotResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    snapshot_date: datetime
    risk_score: float
    expected_loss: float
    p50_loss: float
    p90_loss: float
    p95_loss: float
    critical_findings: int
    critical_assets: int
    critical_attack_paths: int
    open_remediations: int
    overdue_remediations: int
    security_investment: float
    risk_reduction: float
    control_coverage: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
