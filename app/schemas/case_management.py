"""Pydantic schemas for Major Incident Case Management (Phase 10)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CaseItem(BaseModel):
    id: str
    case_number: str
    title: str
    description: str
    severity: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    status: str = Field("OPEN", description="OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED")
    owner: str
    lead_investigator: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    linked_incidents_count: int = 0
    linked_alerts_count: int = 0
    risk_score: float = 80.0
    total_financial_exposure: float = 0.0


class CaseDetailResponse(CaseItem):
    linked_incidents: List[Dict[str, Any]] = []
    linked_alerts: List[Dict[str, Any]] = []
    linked_events: List[Dict[str, Any]] = []
    evidence_items: List[Dict[str, Any]] = []
    tasks: List[Dict[str, Any]] = []
    notes: List[Dict[str, Any]] = []
    threat_intel: Dict[str, Any] = {}
    response_timeline: List[Dict[str, Any]] = []


class CaseCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    severity: str = "HIGH"
    owner: str = Field(..., min_length=2)
    linked_incident_ids: List[str] = []
    linked_alert_ids: List[str] = []


class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    owner: Optional[str] = None
    lead_investigator: Optional[str] = None
