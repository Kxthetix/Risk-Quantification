"""Pydantic schemas for Alerts, Compliance, and Defensive Control Analytics (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AlertSeverity, AlertType, ComplianceFramework, ComplianceStatus
from app.schemas.dashboard import DashboardMeta


class AlertCreate(BaseModel):
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.HIGH
    title: str
    message: str
    source: str = "MANUAL"
    metadata_json: Optional[Dict[str, Any]] = None


class AlertResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    source: str
    acknowledged: bool
    acknowledged_by: Optional[str]
    acknowledged_at: Optional[datetime]
    metadata_json: Optional[Dict[str, Any]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: Optional[str] = None


class AlertsListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    page_size: int


class ComplianceRequirementSchema(BaseModel):
    requirement_id: str
    title: str
    status: str
    evidence_count: int
    confidence: float
    gap: Optional[str] = None


class ComplianceFrameworksListResponse(BaseModel):
    frameworks: List[str]


class ComplianceFrameworkResponse(BaseModel):
    framework: str
    coverage: float
    total_requirements: int
    implemented_count: int
    gaps: List[ComplianceRequirementSchema]
    requirements: List[ComplianceRequirementSchema]
    disclaimer: str = "Compliance coverage is modeled based on active security controls and does not constitute a formal audit or legal certification."
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class ComplianceGapResponse(BaseModel):
    framework: str
    gaps: List[ComplianceRequirementSchema]
    total_gaps: int
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class ControlCoverageResponse(BaseModel):
    coverage: Dict[str, Dict[str, float]]
    meta: DashboardMeta = Field(default_factory=DashboardMeta)


class ControlEffectivenessItem(BaseModel):
    control: str
    applicable_assets: int
    protected_assets: int
    coverage: float
    modeled_risk_reduction: float
    residual_risk: float
    confidence: float


class ControlEffectivenessResponse(BaseModel):
    items: List[ControlEffectivenessItem]
    meta: DashboardMeta = Field(default_factory=DashboardMeta)
