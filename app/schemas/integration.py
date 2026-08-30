"""Pydantic schemas for External Security Integrations (Phase 13)."""
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class IntegrationCatalogItem(BaseModel):
    id: str
    name: str
    category: str
    description: str
    auth_methods: List[str]
    supported_data: List[str]
    sync_methods: List[str]
    version: str
    icon: str


class IntegrationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    category: str = Field(..., min_length=2, max_length=100)
    connector_type: str = Field(..., min_length=2, max_length=100)
    auth_method: str = Field("API_KEY", max_length=50)
    endpoint_url: Optional[str] = Field(None, max_length=1024)
    credentials: Optional[Dict[str, Any]] = None  # Processed and hashed on backend
    sync_frequency: str = Field("HOURLY", max_length=50)
    sync_mode: str = Field("INCREMENTAL", max_length=50)
    is_enabled: bool = True
    field_mappings: Optional[Dict[str, str]] = None
    transformation_rules: Optional[Dict[str, Any]] = None


class IntegrationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    endpoint_url: Optional[str] = Field(None, max_length=1024)
    credentials: Optional[Dict[str, Any]] = None
    sync_frequency: Optional[str] = Field(None, max_length=50)
    sync_mode: Optional[str] = Field(None, max_length=50)
    is_enabled: Optional[bool] = None
    field_mappings: Optional[Dict[str, str]] = None
    transformation_rules: Optional[Dict[str, Any]] = None


class IntegrationResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    category: str
    connector_type: str
    status: str
    auth_method: str
    endpoint_url: Optional[str] = None
    has_credentials: bool = False
    sync_frequency: str
    sync_mode: str
    is_enabled: bool
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_error: Optional[str] = None
    data_types_supported: List[str] = []
    field_mappings: Dict[str, Any] = {}
    transformation_rules: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IntegrationTestRequest(BaseModel):
    endpoint_url: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None


class IntegrationTestResponse(BaseModel):
    status: str  # CONNECTED, FAILED, TIMEOUT, UNAUTHORIZED, RATE_LIMITED
    latency_ms: float
    message: str
    records_preview_count: int = 0


class IntegrationSyncRequest(BaseModel):
    sync_mode: str = "INCREMENTAL"  # INCREMENTAL, FULL
    records: Optional[List[Dict[str, Any]]] = None  # If pushing records directly


class IntegrationSyncResponse(BaseModel):
    log_id: uuid.UUID
    status: str
    records_received: int
    records_accepted: int
    records_rejected: int
    records_updated: int
    records_created: int
    duration_ms: float
    message: str


class IntegrationLogResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    integration_id: uuid.UUID
    operation: str
    status: str
    records_received: int
    records_accepted: int
    records_rejected: int
    records_updated: int
    records_created: int
    duration_ms: float
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IntegrationStatsResponse(BaseModel):
    total_integrations: int
    connected_count: int
    disconnected_count: int
    degraded_count: int
    syncing_count: int
    failed_count: int
    last_sync_at: Optional[datetime] = None


class DataQualityStatsResponse(BaseModel):
    assets_imported: int
    vulnerabilities_imported: int
    threats_imported: int
    events_imported: int
    identities_imported: int
    accepted_percentage: float
    duplicate_percentage: float
    rejected_percentage: float
