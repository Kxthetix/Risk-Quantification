"""Pydantic v2 schemas for CPE dictionary models."""
from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class CPEResponse(BaseModel):
    """Public representation of a CPE dictionary item."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cpe_string: str
    part: str
    vendor: str
    product: str
    version: str
    update: Optional[str] = "*"
    edition: Optional[str] = "*"
    language: Optional[str] = "*"
    created_at: datetime
    updated_at: datetime


class CPEListResponse(BaseModel):
    """Paginated list of CPE records."""
    items: List[CPEResponse]
    page: int
    limit: int
    total: int
