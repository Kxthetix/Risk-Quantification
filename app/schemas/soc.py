"""Pydantic schemas for Security Operations Center (SOC), Triage, Investigation, Tasks & Metrics (Phase 10)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SOCDashboardResponse(BaseModel):
    """Executive KPI summary and real-time operational state for SOC."""
    critical_alerts: int
    open_incidents: int
    incidents_investigating: int
    assets_under_attack: int
    active_playbooks: int
    pending_approvals: int
    failed_actions: int
    financial_exposure: float
    recent_timeline: List[Dict[str, Any]] = []
    active_incidents: List[Dict[str, Any]] = []
    assets_under_response: List[Dict[str, Any]] = []
    response_activity: List[Dict[str, Any]] = []


class SOCMetricsResponse(BaseModel):
    """Deep SOC performance and MTTx metrics."""
    mttd_minutes: float = Field(..., description="Mean Time to Detect")
    mtta_minutes: float = Field(..., description="Mean Time to Acknowledge")
    mttc_minutes: float = Field(..., description="Mean Time to Contain")
    mttr_minutes: float = Field(..., description="Mean Time to Resolve")
    incident_volume_30d: int
    critical_incident_rate_pct: float
    false_positive_rate_pct: float
    playbook_success_rate_pct: float
    automation_rate_pct: float
    sla_compliance_pct: float
    auto_contained_count: int
    manually_contained_count: int
    failed_actions_count: int


class IncidentTriageRequest(BaseModel):
    """Triage decision submitted by an analyst."""
    decision: str = Field(..., description="CONFIRMED, FALSE_POSITIVE, ESCALATED, ASSIGNED")
    reason: str = Field(..., min_length=3)
    assigned_to: Optional[str] = None
    severity: Optional[str] = None
    priority_level: Optional[str] = "HIGH"


class IncidentTriageResponse(BaseModel):
    """Result of an incident triage decision."""
    incident_id: str
    decision: str
    status: str
    severity: str
    analyst: str
    timestamp: datetime
    audit_id: str
    next_step: str


class IncidentAssignmentRequest(BaseModel):
    """Assign an incident to an analyst, team, or commander."""
    assigned_to: str = Field(..., min_length=2)
    assigned_team: Optional[str] = None
    role: str = Field("ANALYST", description="ANALYST, INCIDENT_COMMANDER, RESPONSE_TEAM, REVIEWER")
    notes: Optional[str] = None


class IncidentNoteCreate(BaseModel):
    """Add a structured investigation note."""
    note_type: str = Field("FINDING", description="FINDING, HYPOTHESIS, OBSERVATION, RECOMMENDATION")
    content: str = Field(..., min_length=1)


class IncidentNoteItem(BaseModel):
    id: str
    note_type: str
    content: str
    author: str
    created_at: datetime


class IncidentReviewCreate(BaseModel):
    """Post-Incident Review and Root Cause Analysis (RCA)."""
    root_cause_category: str = Field(
        ...,
        description="Configuration, Vulnerability, Credential, Human Error, Third Party, Malware, Policy, Process, Unknown"
    )
    root_cause_description: str = Field(..., min_length=5)
    contributing_factors: List[str] = []
    affected_controls: List[str] = []
    detection_gaps: Optional[str] = None
    response_gaps: Optional[str] = None
    lessons_learned: str = Field(..., min_length=5)
    corrective_actions: List[str] = []


class IncidentCommunicationCreate(BaseModel):
    """Internal/external stakeholder update dispatch."""
    communication_type: str = Field(
        ...,
        description="INTERNAL_UPDATE, STAKEHOLDER_NOTIFICATION, EXECUTIVE_BRIEF, EXTERNAL_STATUS"
    )
    subject: str = Field(..., min_length=3)
    message: str = Field(..., min_length=5)
    recipients: List[str] = []


class IncidentRelationshipNode(BaseModel):
    id: str
    label: str
    node_type: str = Field(..., description="threat_actor, ioc, event, alert, incident, asset, attack_path, business_service, financial_impact")
    severity: Optional[str] = None
    metadata: Dict[str, Any] = {}


class IncidentRelationshipEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str


class IncidentRelationshipGraphResponse(BaseModel):
    """Graph structure connecting Actor -> IOC -> Event -> Alert -> Incident -> Asset -> Path -> Service -> Impact."""
    incident_id: str
    nodes: List[IncidentRelationshipNode]
    edges: List[IncidentRelationshipEdge]


class SOCTrendDataPoint(BaseModel):
    date: str
    incident_count: int
    critical_count: int
    resolved_count: int
    avg_resolution_time_min: float
    potential_loss: float
    actual_loss: float
    risk_reduced: float


class SOCTrendResponse(BaseModel):
    period: str
    trends: List[SOCTrendDataPoint]


class SOCHitMapItem(BaseModel):
    asset_criticality: str
    incident_severity: str
    business_impact: str
    incident_count: int
    financial_exposure: float
    risk_score: float


class SOCHitMapResponse(BaseModel):
    items: List[SOCHitMapItem]


class SOCTaskItem(BaseModel):
    id: str
    incident_id: str
    incident_number: str
    task: str
    owner: str
    priority: str = "HIGH"
    status: str = "OPEN"
    due_date: Optional[datetime] = None
    created_at: datetime
    sla_status: str = Field("ON_TRACK", description="ON_TRACK, AT_RISK, BREACHED")


class SOCTaskCreate(BaseModel):
    incident_id: str
    task: str = Field(..., min_length=2)
    owner: str = Field(..., min_length=2)
    priority: str = "HIGH"
    due_date: Optional[datetime] = None


class SOCTaskUpdate(BaseModel):
    status: Optional[str] = None
    owner: Optional[str] = None
    priority: Optional[str] = None
