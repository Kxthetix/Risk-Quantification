"""Pydantic v2 schemas for Asset create, update, list, and response DTOs."""
from datetime import datetime
from typing import Any, List, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import (
    AssetCriticality,
    AssetEnvironment,
    AssetStatus,
    AssetType,
    DataClassification,
)
from app.utils.asset_helpers import validate_ip_address, validate_mac_address


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class AssetCreate(BaseModel):
    """Payload for creating a new asset."""
    name: str = Field(..., min_length=1, max_length=255, description="Human-readable asset name")
    description: Optional[str] = Field(None, max_length=2000)
    asset_type: AssetType = Field(..., description="Classification of the asset")
    hostname: Optional[str] = Field(None, max_length=255, description="FQDN or short hostname")
    ip_address: Optional[str] = Field(None, max_length=45, description="IPv4 or IPv6 address")
    mac_address: Optional[str] = Field(None, max_length=17)
    operating_system: Optional[str] = Field(None, max_length=100)
    os_version: Optional[str] = Field(None, max_length=50)
    environment: AssetEnvironment = Field(default=AssetEnvironment.OTHER)
    criticality: AssetCriticality = Field(default=AssetCriticality.MEDIUM)
    business_value: Optional[float] = Field(
        None, ge=0, description="Estimated monetary business value (non-negative)"
    )
    data_classification: DataClassification = Field(default=DataClassification.INTERNAL)
    internet_exposed: bool = Field(default=False)
    status: AssetStatus = Field(default=AssetStatus.ACTIVE)
    location: Optional[str] = Field(None, max_length=255)
    owner: Optional[str] = Field(None, max_length=255)

    @field_validator("ip_address")
    @classmethod
    def validate_ip(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_ip_address(v):
            raise ValueError(f"'{v}' is not a valid IPv4 or IPv6 address.")
        return v

    @field_validator("mac_address")
    @classmethod
    def validate_mac(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_mac_address(v):
            raise ValueError(
                f"'{v}' is not a valid MAC address. Expected format: XX:XX:XX:XX:XX:XX"
            )
        return v

    @field_validator("business_value")
    @classmethod
    def validate_business_value(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("Business value cannot be negative.")
        return v


class AssetUpdate(AssetCreate):
    """Full update payload — all fields required (PUT semantics)."""
    # Inherits all fields from AssetCreate, just changes description
    pass


class AssetPatch(BaseModel):
    """Partial update payload (PATCH semantics — all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    asset_type: Optional[AssetType] = None
    hostname: Optional[str] = Field(None, max_length=255)
    ip_address: Optional[str] = Field(None, max_length=45)
    mac_address: Optional[str] = Field(None, max_length=17)
    operating_system: Optional[str] = Field(None, max_length=100)
    os_version: Optional[str] = Field(None, max_length=50)
    environment: Optional[AssetEnvironment] = None
    criticality: Optional[AssetCriticality] = None
    business_value: Optional[float] = Field(None, ge=0)
    data_classification: Optional[DataClassification] = None
    internet_exposed: Optional[bool] = None
    status: Optional[AssetStatus] = None
    location: Optional[str] = Field(None, max_length=255)
    owner: Optional[str] = Field(None, max_length=255)

    @field_validator("ip_address")
    @classmethod
    def validate_ip(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_ip_address(v):
            raise ValueError(f"'{v}' is not a valid IPv4 or IPv6 address.")
        return v

    @field_validator("mac_address")
    @classmethod
    def validate_mac(cls, v: Optional[str]) -> Optional[str]:
        if v and not validate_mac_address(v):
            raise ValueError(
                f"'{v}' is not a valid MAC address. Expected format: XX:XX:XX:XX:XX:XX"
            )
        return v


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class AssetResponse(BaseModel):
    """Public asset representation — no internal database fields exposed."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    description: Optional[str] = None
    asset_type: AssetType
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    operating_system: Optional[str] = None
    os_version: Optional[str] = None
    environment: AssetEnvironment
    criticality: AssetCriticality
    business_value: Optional[float] = None
    data_classification: DataClassification
    internet_exposed: bool
    status: AssetStatus
    location: Optional[str] = None
    owner: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AssetDetailResponse(AssetResponse):
    """Extended asset response including software count and inventory list."""
    software_count: int = 0
    software: List[Any] = []  # Populated with SoftwareResponse in the API layer


# ---------------------------------------------------------------------------
# Pagination & collection schemas
# ---------------------------------------------------------------------------

class AssetListResponse(BaseModel):
    """Paginated list of assets with metadata."""
    items: List[AssetResponse]
    page: int
    limit: int
    total: int


class AssetStatisticsResponse(BaseModel):
    """Dashboard-ready aggregate statistics for an organization's asset inventory."""
    total_assets: int
    active_assets: int
    critical_assets: int
    internet_exposed_assets: int
    production_assets: int
    servers: int
    databases: int
    network_devices: int
    by_type: dict[str, int] = {}
    by_criticality: dict[str, int] = {}
    by_environment: dict[str, int] = {}
    by_status: dict[str, int] = {}


# ---------------------------------------------------------------------------
# Import / Export schemas
# ---------------------------------------------------------------------------

class ImportRowError(BaseModel):
    """Describes a validation failure for a specific CSV import row."""
    row: int
    field: Optional[str] = None
    message: str


class ImportResultResponse(BaseModel):
    """Result summary of a CSV asset import operation."""
    total_rows: int
    successful: int
    failed: int
    errors: List[ImportRowError] = []
