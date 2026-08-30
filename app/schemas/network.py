"""Pydantic schemas for Network Relationships and Topology (Phase 7)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import NetworkDirection, NetworkRelationshipType


class NetworkRelationshipCreate(BaseModel):
    source_asset_id: uuid.UUID
    destination_asset_id: uuid.UUID
    relationship_type: NetworkRelationshipType = Field(default=NetworkRelationshipType.NETWORK_REACHABILITY)
    protocol: Optional[str] = Field(default="TCP", max_length=32)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    direction: NetworkDirection = Field(default=NetworkDirection.OUTBOUND)
    verified: bool = Field(default=True)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    evidence: Optional[Dict[str, Any]] = None


class NetworkRelationshipUpdate(BaseModel):
    relationship_type: Optional[NetworkRelationshipType] = None
    protocol: Optional[str] = Field(None, max_length=32)
    port: Optional[int] = Field(None, ge=1, le=65535)
    direction: Optional[NetworkDirection] = None
    verified: Optional[bool] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    evidence: Optional[Dict[str, Any]] = None


class NetworkRelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    source_asset_id: uuid.UUID
    destination_asset_id: uuid.UUID
    relationship_type: NetworkRelationshipType
    protocol: Optional[str] = None
    port: Optional[int] = None
    direction: NetworkDirection
    verified: bool
    confidence: float
    evidence: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
