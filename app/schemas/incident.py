"""Pydantic schemas for Incident Management, Lifecycle & Response Actions (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field

from app.models.enums import RiskLevel


class IncidentSummaryResponse(BaseModel):
    """Executive KPI summary for Incidents."""
    open_incidents: int
    critical_incidents: int
    investigating_count: int
    contained_count: int
    resolved_count: int
    avg_response_time_minutes: float
    mttd_minutes: float
    mtta_minutes: float
    mttc_minutes: float = Field(..., description="Mean Time to Contain")
    mttr_minutes: float = Field(..., description="Mean Time to Resolve")
    total_financial_exposure: float


class IncidentItem(BaseModel):
    """Incident list item descriptor."""
    id: str
    incident_number: str
    title: str
    description: str
    severity: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    status: str = Field("DETECTED", description="DETECTED, TRIAGED, INVESTIGATING, CONTAINED, ERADICATED, RECOVERED, CLOSED")
    owner: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    affected_assets_count: int = 0
    business_service_name: Optional[str] = None
    financial_exposure: float = 0.0
    threat_actor: Optional[str] = None
    mitre_technique: Optional[str] = None


class IncidentDetailResponse(IncidentItem):
    """Deep inspection of an incident."""
    affected_assets: List[Dict[str, Any]] = []
    affected_business_services: List[Dict[str, Any]] = []
    related_alerts: List[Dict[str, Any]] = []
    related_events: List[Dict[str, Any]] = []
    related_iocs: List[Dict[str, Any]] = []
    attack_paths: List[Dict[str, Any]] = []
    potential_loss: float = 0.0
    expected_annual_loss: float = 0.0
    downtime_exposure: float = 0.0
    recovery_cost: float = 0.0
    timeline: List[Dict[str, Any]] = []
    evidence_items: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    comments: List[Dict[str, Any]] = []
    response_actions: List[Dict[str, Any]] = []


class IncidentCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    severity: str = "HIGH"
    affected_asset_ids: List[str] = []
    business_service_id: Optional[str] = None
    owner: Optional[str] = None
    initial_assessment: Optional[str] = None
    alert_id: Optional[str] = None


class IncidentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    owner: Optional[str] = None


class IncidentCommentCreate(BaseModel):
    comment: str = Field(..., min_length=1)


class IncidentTaskCreate(BaseModel):
    task: str = Field(..., min_length=2)
    owner: Optional[str] = None
    priority: str = "HIGH"
    due_date: Optional[datetime] = None


class IncidentTaskUpdate(BaseModel):
    status: str = Field(..., description="OPEN, IN_PROGRESS, BLOCKED, COMPLETED, CANCELLED")


class IncidentEvidenceCreate(BaseModel):
    title: str = Field(..., min_length=2)
    evidence_type: str = Field(..., description="LOGS, SCREENSHOT, REPORT, DOCUMENT, EXPORT, NOTES")
    description: Optional[str] = None
    file_name: str
    file_size_bytes: int = 0
    file_hash: Optional[str] = None


class IncidentResponseActionExecute(BaseModel):
    action_type: str = Field(..., description="ISOLATE_ASSET, BLOCK_IOC, DISABLE_ACCOUNT, REVOKE_SESSION, RESET_CREDENTIAL, BLOCK_DOMAIN, BLOCK_IP")
    target: str = Field(..., description="Target hostname, IP, username, or IOC string")
    reason: str = Field(..., min_length=3)
    automated: bool = False
