"""Pydantic schemas for Remediation Prioritization & Lifecycle (Phase 8)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RemediationPriorityLevel, RemediationStatus, RemediationType


class RemediationCostCreate(BaseModel):
    minimum_cost: float = Field(ge=0.0)
    most_likely_cost: float = Field(ge=0.0)
    maximum_cost: float = Field(ge=0.0)
    currency: str = Field(default="INR", max_length=8)
    labor_cost: float = Field(default=0.0, ge=0.0)
    technology_cost: float = Field(default=0.0, ge=0.0)
    consulting_cost: float = Field(default=0.0, ge=0.0)
    downtime_cost: float = Field(default=0.0, ge=0.0)
    licensing_cost: float = Field(default=0.0, ge=0.0)
    recurring_cost: float = Field(default=0.0, ge=0.0)
    one_time_cost: float = Field(default=0.0, ge=0.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class RemediationCostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    remediation_id: uuid.UUID
    minimum_cost: float
    most_likely_cost: float
    maximum_cost: float
    currency: str
    labor_cost: float
    technology_cost: float
    consulting_cost: float
    downtime_cost: float
    licensing_cost: float
    recurring_cost: float
    one_time_cost: float
    confidence: float


class RemediationCreate(BaseModel):
    asset_vulnerability_id: Optional[uuid.UUID] = None
    title: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    remediation_type: RemediationType = Field(default=RemediationType.PATCH)
    estimated_cost: float = Field(default=0.0, ge=0.0)
    estimated_duration_hours: float = Field(default=0.0, ge=0.0)
    owner: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    depends_on_remediation_id: Optional[uuid.UUID] = None
    cost_details: Optional[RemediationCostCreate] = None


class RemediationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    remediation_type: Optional[RemediationType] = None
    status: Optional[RemediationStatus] = None
    estimated_cost: Optional[float] = Field(None, ge=0.0)
    estimated_duration_hours: Optional[float] = Field(None, ge=0.0)
    owner: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    depends_on_remediation_id: Optional[uuid.UUID] = None


class RemediationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    asset_vulnerability_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    remediation_type: RemediationType
    status: RemediationStatus
    priority_score: float
    priority_level: RemediationPriorityLevel
    estimated_cost: float
    estimated_duration_hours: float
    risk_reduction: float
    expected_loss_reduction: float
    owner: Optional[str] = None
    due_date: Optional[datetime] = None
    depends_on_remediation_id: Optional[uuid.UUID] = None
    risk_acceptance_reason: Optional[str] = None
    risk_accepted_by: Optional[str] = None
    risk_accepted_at: Optional[datetime] = None
    risk_acceptance_expiry: Optional[datetime] = None
    verification_date: Optional[datetime] = None
    remediation_cost: Optional[RemediationCostResponse] = None
    created_at: datetime
    updated_at: datetime


class RemediationListResponse(BaseModel):
    remediations: List[RemediationResponse]
    total: int


class RiskAcceptanceRequest(BaseModel):
    reason: str = Field(min_length=5)
    approved_by: str = Field(min_length=2, max_length=255)
    expiry_date: datetime


class RemediationVerifyRequest(BaseModel):
    verification_notes: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None


class RemediationSimulateResponse(BaseModel):
    remediation_id: uuid.UUID
    title: str
    current_risk: float
    residual_risk: float
    risk_reduction: float
    current_expected_loss: float
    residual_expected_loss: float
    expected_loss_reduction: float
    implementation_cost: float
    roi: float
    risk_reduction_per_rupee: float
    attack_paths_reduced: int
    tco_1yr: float
    tco_3yr: float


class TopRemediationItem(BaseModel):
    remediation_id: uuid.UUID
    title: str
    remediation_type: str
    priority_score: float
    priority_level: str
    estimated_cost: float
    risk_reduction: float
    expected_loss_reduction: float
    roi: float
    risk_reduction_per_rupee: float
    attack_paths_reduced: int
    asset_name: Optional[str] = None
    cve_id: Optional[str] = None
    justifications: List[str] = Field(default_factory=list)


class TopRemediationsResponse(BaseModel):
    items: List[TopRemediationItem]
    total_remediations: int
