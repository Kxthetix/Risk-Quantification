"""Pydantic schemas for vulnerability validation runs, responses, statistics, and rules."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ValidationStatus


class ValidationRunRequest(BaseModel):
    """Payload to trigger validation against an asset vulnerability."""
    asset_vulnerability_id: uuid.UUID = Field(
        ..., description="UUID of the AssetVulnerability to validate."
    )
    synchronous: bool = Field(
        default=False,
        description="Whether to run evaluation synchronously before returning response."
    )


class ValidationRunResponse(BaseModel):
    """Immediate response after triggering validation."""
    validation_id: uuid.UUID
    status: ValidationStatus


class ValidationHistoryResponse(BaseModel):
    """Historical audit snapshot of a validation state change."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    validation_id: uuid.UUID
    previous_status: Optional[str] = None
    new_status: str
    previous_score: Optional[float] = None
    new_score: float
    previous_confidence: Optional[float] = None
    new_confidence: float
    changed_by: Optional[uuid.UUID] = None
    reason: Optional[str] = None
    created_at: datetime


class ValidationResponse(BaseModel):
    """Comprehensive representation of a vulnerability validation finding."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    asset_vulnerability_id: uuid.UUID
    status: ValidationStatus = Field(..., validation_alias="validation_status")
    validation_score: float
    confidence: float
    version_check: str
    configuration_check: str
    exposure_check: str
    exploit_check: str
    mitigation_check: str
    evidence_count: int
    reasons: Optional[List[str]] = None
    validated_at: Optional[datetime] = None
    validated_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


class ValidationDetailedResponse(BaseModel):
    """Full explainability document matching prompt Section 37 structure."""
    asset: Dict[str, Any]
    software: Optional[Dict[str, Any]] = None
    vulnerability: Dict[str, Any]
    validation: Dict[str, Any]
    evidence: List[Dict[str, Any]]
    reasons: List[str]


class ValidationBulkRequest(BaseModel):
    """Payload to trigger bulk vulnerability validation."""
    asset_ids: Optional[List[uuid.UUID]] = Field(
        default=None, description="Optional list of specific asset IDs to validate."
    )
    organization_id: Optional[uuid.UUID] = Field(
        default=None, description="Optional organization ID for broad evaluation."
    )


class ValidationBulkResponse(BaseModel):
    """Bulk job launch confirmation."""
    queued_count: int
    job_id: uuid.UUID
    status: str


class ValidationStatisticsResponse(BaseModel):
    """Aggregated validation metrics for dashboards and analyst reporting."""
    total: int
    confirmed: int
    likely_vulnerable: int
    unknown: int
    likely_not_vulnerable: int
    false_positive: int
    high_confidence_findings: int
    unknown_findings: int
    needs_manual_review: int


class ValidationRuleResponse(BaseModel):
    """Rule weight definition schema."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rule_id: str
    name: str
    description: Optional[str] = None
    evidence_type: Optional[str] = None
    weight: float
    enabled: bool


class ValidationRuleUpdate(BaseModel):
    """Payload for modifying a rule's weight or enabled status."""
    weight: Optional[float] = Field(None, description="New numerical score weight.")
    enabled: Optional[bool] = Field(None, description="Toggle rule active status.")
