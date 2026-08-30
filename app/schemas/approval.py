"""Pydantic schemas for SOAR Approvals & High-Risk Safeguards (Phase 10)."""
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ApprovalItem(BaseModel):
    id: str
    incident_id: Optional[str] = None
    incident_number: Optional[str] = None
    playbook_id: Optional[str] = None
    playbook_name: Optional[str] = None
    execution_id: Optional[str] = None
    action_type: str
    target: str
    reason: str
    requested_by: str
    potential_impact: str
    current_risk_exposure: float
    projected_risk_exposure: float
    status: str = Field("PENDING", description="PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED")
    created_at: datetime
    expires_at: datetime
    decision_by: Optional[str] = None
    decision_at: Optional[datetime] = None
    decision_notes: Optional[str] = None
    is_high_risk: bool = True


class ApprovalDetailResponse(ApprovalItem):
    target_details: Dict[str, Any] = {}
    affected_services: list[str] = []
    affected_assets: list[str] = []


class ApprovalActionRequest(BaseModel):
    decision: str = Field(..., description="APPROVE, REJECT")
    justification: str = Field(..., min_length=3)
    approver_name: Optional[str] = None
    confirmed_destructive_risk: bool = Field(False, description="Must be true for high-risk actions")
