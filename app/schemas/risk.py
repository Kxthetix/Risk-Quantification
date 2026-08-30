"""Pydantic schemas for Cyber Risk Scoring Engine (Phase 5)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import RiskLevel, RiskAssessmentStatus
from app.schemas.risk_factor import RiskFactorResponse


class RiskCalculateRequest(BaseModel):
    """Payload to trigger risk calculation for an asset vulnerability."""
    asset_vulnerability_id: uuid.UUID
    synchronous: Optional[bool] = True


class RiskCalculateBulkRequest(BaseModel):
    """Payload to trigger bulk risk calculations."""
    asset_ids: Optional[List[uuid.UUID]] = None
    all_organization_assets: Optional[bool] = False


class RiskCalculateResponse(BaseModel):
    """Immediate response after initiating a risk calculation."""
    risk_assessment_id: uuid.UUID
    status: RiskAssessmentStatus


class RiskAssessmentResponse(BaseModel):
    """Full representation of an asset vulnerability cyber risk assessment."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    asset_vulnerability_id: uuid.UUID
    score: float = Field(..., validation_alias="final_risk_score")
    level: RiskLevel = Field(..., validation_alias="risk_level")
    method: str = Field(..., validation_alias="risk_method")
    model_version: str = Field(..., validation_alias="risk_model_version")
    likelihood_score: float
    impact_score: float
    exposure_score: float
    exploitability_score: float
    validation_score: float
    control_score: float
    business_criticality_score: float
    factors: List[RiskFactorResponse]
    explanation: Optional[List[str]] = None
    calculated_at: datetime


class AssetRiskResponse(BaseModel):
    """Aggregated risk profile for a specific asset."""
    asset_id: uuid.UUID
    asset_name: str
    overall_risk_score: float
    risk_level: RiskLevel
    open_findings: int
    critical_findings: int
    high_findings: int


class OrganizationRiskResponse(BaseModel):
    """Portfolio-wide cyber risk profile for an organization."""
    overall_risk_score: float
    risk_level: RiskLevel
    assets: int
    critical_assets: int
    critical_findings: int
    high_findings: int


class RiskDistributionResponse(BaseModel):
    """Distribution of validated risk findings across qualitative tiers."""
    LOW: int = 0
    MEDIUM: int = 0
    HIGH: int = 0
    VERY_HIGH: int = 0
    CRITICAL: int = 0


class TopRiskItem(BaseModel):
    """Top-priority risk finding item."""
    risk_id: uuid.UUID
    asset_id: uuid.UUID
    asset: str
    cve_id: str
    risk_score: float
    risk_level: RiskLevel
    criticality: str
    known_exploited: bool
    business_value: float


class TopRisksResponse(BaseModel):
    """Prioritized list of highest-risk organizational findings."""
    items: List[TopRiskItem]


class RiskRuleItem(BaseModel):
    """Individual configurable risk rule."""
    factor: str
    weight: float
    enabled: bool = True
    parameters: Optional[Dict[str, Any]] = None


class RiskConfigResponse(BaseModel):
    """Current risk calculation configuration for an organization."""
    model_version: str
    weights: Dict[str, float]
    thresholds: Dict[str, float]
    rules: List[RiskRuleItem]


class RiskConfigUpdate(BaseModel):
    """Update payload for risk configuration weights and rules."""
    weights: Optional[Dict[str, float]] = None
    thresholds: Optional[Dict[str, float]] = None
    rules: Optional[List[RiskRuleItem]] = None
