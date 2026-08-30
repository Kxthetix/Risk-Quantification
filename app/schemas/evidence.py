"""Pydantic schemas for evidence collection, creation, and inspection."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EvidenceResult, EvidenceSource, EvidenceType


class EvidenceCreate(BaseModel):
    """Payload for submitting new validation evidence."""
    evidence_type: EvidenceType = Field(..., description="Category of evidence being recorded.")
    source: EvidenceSource = Field(
        default=EvidenceSource.MANUAL,
        description="Origin source of evidence."
    )
    value: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Empirical value, scan finding, or observation text."
    )
    result: EvidenceResult = Field(
        default=EvidenceResult.CONFIRMED,
        description="Verification result: CONFIRMED, NOT_CONFIRMED, or UNKNOWN."
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence weighting in this piece of evidence (0.0 to 1.0)."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Arbitrary structured metadata or scan telemetry."
    )


class EvidenceResponse(BaseModel):
    """Detailed representation of recorded evidence."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    asset_id: uuid.UUID
    asset_vulnerability_id: Optional[uuid.UUID] = None
    evidence_type: EvidenceType
    source: EvidenceSource
    value: str
    result: EvidenceResult
    confidence: float
    collected_at: datetime
    collected_by: Optional[uuid.UUID] = None
    metadata: Optional[Any] = Field(default=None, alias="extra_metadata")
    created_at: datetime
    updated_at: datetime


class EvidenceListResponse(BaseModel):
    """List of evidence records with total count."""
    items: List[EvidenceResponse]
    total: int
