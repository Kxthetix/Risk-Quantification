"""Pydantic schemas for Security & Risk Alerts (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field

from app.models.enums import AlertSeverity, AlertType, RiskLevel


class AlertSummaryResponse(BaseModel):
    """Executive KPI summary for Security Alerts."""
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    open_alerts: int
    investigating_alerts: int
    resolved_alerts: int
    false_positives_count: int
    mttd_minutes: float = Field(..., description="Mean Time to Detect")
    mtta_minutes: float = Field(..., description="Mean Time to Acknowledge")
    mttr_minutes: float = Field(..., description="Mean Time to Resolve")
    false_positive_rate_pct: float


class DetailedAlertItem(BaseModel):
    id: str
    organization_id: str
    title: str
    message: str
    alert_type: AlertType
    severity: AlertSeverity
    source: str
    status: str = Field("NEW", description="NEW, ACKNOWLEDGED, INVESTIGATING, CONTAINED, RESOLVED, CLOSED, FALSE_POSITIVE")
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    ioc_indicator: Optional[str] = None
    threat_actor: Optional[str] = None
    mitre_technique: Optional[str] = None
    mitre_tactic: Optional[str] = None
    risk_score: float = 85.0
    financial_impact: float = 0.0
    created_at: datetime
    updated_at: datetime


class AlertDetailResponse(DetailedAlertItem):
    """Deep inspection of an alert."""
    detection_rule_id: Optional[str] = None
    detection_rule_name: Optional[str] = None
    related_events: List[Dict[str, Any]] = []
    related_alerts: List[Dict[str, Any]] = []
    attack_path_id: Optional[str] = None
    attack_path_name: Optional[str] = None
    business_service_id: Optional[str] = None
    business_service_name: Optional[str] = None
    incident_id: Optional[str] = None
    incident_title: Optional[str] = None
    resolution_notes: Optional[str] = None
    false_positive_reason: Optional[str] = None
    timeline_events: List[Dict[str, Any]] = []


class AlertAssignRequest(BaseModel):
    assigned_to: str = Field(..., min_length=2)
    notes: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_notes: str = Field(..., min_length=5)
    root_cause: Optional[str] = None


class AlertFalsePositiveRequest(BaseModel):
    reason: str = Field(..., min_length=5)
    comment: Optional[str] = None


class AlertEscalateRequest(BaseModel):
    incident_title: Optional[str] = None
    severity: Optional[str] = None
    initial_notes: Optional[str] = None


class AlertCorrelationGroupItem(BaseModel):
    group_key: str
    common_attribute: str
    attribute_value: str
    alerts_count: int
    first_seen: datetime
    last_seen: datetime
    max_severity: AlertSeverity
    alerts: List[DetailedAlertItem]
