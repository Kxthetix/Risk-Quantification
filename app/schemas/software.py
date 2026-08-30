"""Pydantic v2 schemas for Software create, update, response, and asset-software DTOs."""
from datetime import datetime
from typing import List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import Architecture, PackageManager, SoftwareSource
from app.utils.asset_helpers import normalize_cpe, validate_cpe


# ---------------------------------------------------------------------------
# Software schemas
# ---------------------------------------------------------------------------

class SoftwareCreate(BaseModel):
    """Payload for registering a new software record."""
    vendor: str = Field(..., min_length=1, max_length=255, description="Software vendor / publisher name")
    product_name: str = Field(..., min_length=1, max_length=255, description="Product name (e.g. HTTP Server)")
    product_version: str = Field(..., min_length=1, max_length=100, description="Semantic version string")
    edition: Optional[str] = Field(None, max_length=100)
    architecture: Architecture = Field(default=Architecture.UNKNOWN)
    package_manager: PackageManager = Field(default=PackageManager.UNKNOWN)
    cpe: Optional[str] = Field(
        None,
        max_length=500,
        description="CPE 2.3 identifier (e.g. cpe:2.3:a:apache:http_server:2.4.49:*:*:*:*:*:*:*)",
    )
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("cpe")
    @classmethod
    def validate_cpe_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        normalized = normalize_cpe(v)
        if not validate_cpe(normalized):
            raise ValueError(
                f"Invalid CPE 2.3 format. Expected: cpe:2.3:<type>:<vendor>:<product>:<version>:...:*"
            )
        return normalized


class SoftwareUpdate(SoftwareCreate):
    """Full software update payload (PUT semantics)."""
    pass


class SoftwarePatch(BaseModel):
    """Partial software update payload (PATCH semantics)."""
    vendor: Optional[str] = Field(None, min_length=1, max_length=255)
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    product_version: Optional[str] = Field(None, min_length=1, max_length=100)
    edition: Optional[str] = Field(None, max_length=100)
    architecture: Optional[Architecture] = None
    package_manager: Optional[PackageManager] = None
    cpe: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("cpe")
    @classmethod
    def validate_cpe_format(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v.strip() == "":
            return None
        normalized = normalize_cpe(v)
        if not validate_cpe(normalized):
            raise ValueError("Invalid CPE 2.3 format.")
        return normalized


class SoftwareResponse(BaseModel):
    """Public software representation."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    vendor: str
    product_name: str
    product_version: str
    edition: Optional[str] = None
    architecture: Architecture
    package_manager: PackageManager
    cpe: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class SoftwareListResponse(BaseModel):
    """Paginated software list."""
    items: List[SoftwareResponse]
    page: int
    limit: int
    total: int


# ---------------------------------------------------------------------------
# Asset-Software (junction) schemas
# ---------------------------------------------------------------------------

class AssetSoftwareAttach(BaseModel):
    """Payload for attaching a software package to an asset."""
    software_id: uuid.UUID = Field(..., description="UUID of the software to attach")
    installed_version: Optional[str] = Field(
        None, max_length=100, description="Specific installed version on this asset"
    )
    installation_path: Optional[str] = Field(
        None, max_length=500, description="Filesystem path where software is installed"
    )
    source: SoftwareSource = Field(
        default=SoftwareSource.MANUAL, description="Discovery method / source"
    )
    is_active: bool = Field(default=True)


class AssetSoftwareResponse(BaseModel):
    """Software entry as it appears in an asset's software list."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID                       # AssetSoftware junction row ID
    software_id: uuid.UUID
    vendor: str
    product_name: str
    product_version: str
    installed_version: Optional[str] = None
    installation_path: Optional[str] = None
    source: SoftwareSource
    cpe: Optional[str] = None
    is_active: bool
    first_seen: datetime
    last_seen: datetime


class AssetSoftwareListResponse(BaseModel):
    """Response for listing software associated with a specific asset."""
    asset_id: uuid.UUID
    software: List[AssetSoftwareResponse]
    total: int
