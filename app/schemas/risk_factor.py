"""Pydantic schemas for Risk Factors (Phase 5)."""
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class RiskFactorResponse(BaseModel):
    """Breakdown of an individual risk factor contribution."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    name: str = Field(..., validation_alias="factor_name")
    raw_value: Optional[str] = None
    value: float = Field(..., validation_alias="normalized_value")
    weight: float
    contribution: float
    extra_metadata: Optional[Dict[str, Any]] = None
