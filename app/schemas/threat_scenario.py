"""Pydantic schemas for Threat Scenarios & Adversary Modeling (Phase 7)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import AttackerProfile, ThreatScenarioStatus


class ThreatScenarioCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    attacker_profile: AttackerProfile = Field(default=AttackerProfile.EXTERNAL_ATTACKER)
    objective: Optional[str] = Field(None, max_length=255)
    entry_point: Optional[str] = Field(None, max_length=255)
    target_asset_id: Optional[uuid.UUID] = None
    target_asset_name: Optional[str] = None
    probability: float = Field(default=0.5, ge=0.0, le=1.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    risk_score: float = Field(default=50.0, ge=0.0, le=100.0)
    financial_assessment_id: Optional[uuid.UUID] = None
    scenario_metadata: Optional[Dict[str, Any]] = None


class ThreatScenarioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    attacker_profile: Optional[AttackerProfile] = None
    objective: Optional[str] = Field(None, max_length=255)
    entry_point: Optional[str] = Field(None, max_length=255)
    target_asset_id: Optional[uuid.UUID] = None
    target_asset_name: Optional[str] = None
    probability: Optional[float] = Field(None, ge=0.0, le=1.0)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    financial_assessment_id: Optional[uuid.UUID] = None
    status: Optional[ThreatScenarioStatus] = None
    scenario_metadata: Optional[Dict[str, Any]] = None


class ThreatScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    attacker_profile: AttackerProfile
    objective: Optional[str] = None
    entry_point: Optional[str] = None
    target_asset_id: Optional[uuid.UUID] = None
    target_asset_name: Optional[str] = None
    probability: float
    confidence: float
    risk_score: float
    financial_assessment_id: Optional[uuid.UUID] = None
    financial_exposure: Optional[Dict[str, Any]] = None
    status: ThreatScenarioStatus
    scenario_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class ScenarioGenerateRequest(BaseModel):
    target_asset_id: Optional[uuid.UUID] = None
    generate_templates: bool = Field(default=True)
    generate_from_paths: bool = Field(default=True)


class ThreatScenarioCompareItem(BaseModel):
    scenario_id: uuid.UUID
    name: str
    attacker_profile: str
    likelihood: float
    impact: float
    risk_score: float
    expected_loss: float
    p90_loss: float
    target_criticality: Optional[str] = None
    confidence: float
    path_length: int


class ThreatScenarioCompareResponse(BaseModel):
    scenarios: List[ThreatScenarioCompareItem]
    highest_risk_scenario_id: Optional[uuid.UUID] = None
    highest_loss_scenario_id: Optional[uuid.UUID] = None
