"""Pydantic schemas for Automated Remediation, Verification & Risk Recalculation (Phase 10)."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SOCRemediationItem(BaseModel):
    id: str
    incident_id: str
    incident_number: str
    asset_id: str
    asset_name: str
    action_type: str
    description: str
    owner: str
    priority: str = "HIGH"
    status: str = Field("PENDING", description="PENDING, IN_PROGRESS, COMPLETED, VERIFIED, FAILED, CANCELLED")
    expected_risk_reduction_pct: float = 35.0
    expected_financial_reduction: float = 500000.0
    created_at: datetime
    updated_at: datetime
    verified_at: Optional[datetime] = None
    verification_status: Optional[str] = None


class SOCRemediationCreate(BaseModel):
    incident_id: str
    asset_id: str
    asset_name: str
    action_type: str
    description: str
    owner: str
    priority: str = "HIGH"


class SOCRemediationVerifyRequest(BaseModel):
    verifier_notes: str = Field(..., min_length=3)
    run_live_rescan: bool = True


class SOCRemediationVerifyResponse(BaseModel):
    remediation_id: str
    verification_status: str = Field("VERIFIED", description="VERIFIED, THREAT_STILL_PRESENT, FAILED")
    threat_cleared: bool = True
    new_risk_score: float
    financial_exposure_before: float
    financial_exposure_after: float
    recalculated_at: datetime
    audit_notes: str
