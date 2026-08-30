"""Pydantic v2 schemas for CWE and reference data."""
from typing import Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class CWEResponse(BaseModel):
    """CWE dictionary definition schema."""
    model_config = ConfigDict(from_attributes=True)

    cwe_id: str
    name: str
    description: Optional[str] = None


class CVEReference(BaseModel):
    """External reference link for a CVE."""
    url: str
    source: Optional[str] = None
    tags: Optional[list[str]] = []
