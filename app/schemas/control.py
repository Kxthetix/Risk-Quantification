"""Pydantic schemas for Defensive Security Controls & Effectiveness (Phase 8)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ControlType


class ControlEffectivenessCreate(BaseModel):
    threat_type: str = Field(min_length=2, max_length=64)
    risk_factor: str = Field(min_length=2, max_length=64)
    reduction_factor: float = Field(default=0.5, ge=0.0, le=1.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    evidence: Optional[Dict[str, Any]] = None


class ControlEffectivenessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    control_id: uuid.UUID
    threat_type: str
    risk_factor: str
    reduction_factor: float
    confidence: float
    evidence: Optional[Dict[str, Any]] = None


class ControlCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    control_type: ControlType = Field(default=ControlType.WAF)
    description: Optional[str] = None
    implementation_cost: float = Field(default=0.0, ge=0.0)
    annual_cost: float = Field(default=0.0, ge=0.0)
    effectiveness: float = Field(default=0.8, ge=0.0, le=1.0)
    enabled: bool = Field(default=True)
    effectiveness_mappings: Optional[List[ControlEffectivenessCreate]] = None


class ControlUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    control_type: Optional[ControlType] = None
    description: Optional[str] = None
    implementation_cost: Optional[float] = Field(None, ge=0.0)
    annual_cost: Optional[float] = Field(None, ge=0.0)
    effectiveness: Optional[float] = Field(None, ge=0.0, le=1.0)
    enabled: Optional[bool] = None


class ControlResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    control_type: ControlType
    description: Optional[str] = None
    implementation_cost: float
    annual_cost: float
    effectiveness: float
    enabled: bool
    effectiveness_mappings: List[ControlEffectivenessResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
