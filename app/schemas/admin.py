from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.user import UserRole


# 1. User Invitation
class UserInvitationCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255, description="Invitee email address")
    organization_id: Optional[uuid.UUID] = Field(None, description="Scope target organization")
    role: UserRole = Field(default=UserRole.VIEWER)
    expiration_hours: int = Field(default=24, ge=1, le=168)
    message: Optional[str] = Field(None, max_length=500)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not v or "@" not in str(v):
            raise ValueError("Invalid email address format")
        return str(v).lower().strip()


class UserInvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    organization_id: uuid.UUID
    role: UserRole
    expires_at: datetime
    message: Optional[str] = None
    created_at: datetime


UserInviteCreate = UserInvitationCreate
UserInviteResponse = UserInvitationResponse


# 2. Security Policies
class SecurityPolicyUpdate(BaseModel):
    password_policy: Optional[Dict[str, Any]] = None
    session_policy: Optional[Dict[str, Any]] = None
    mfa_policy: Optional[Dict[str, Any]] = None
    data_retention_policy: Optional[Dict[str, Any]] = None


class SecurityPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    password_policy: Dict[str, Any]
    session_policy: Dict[str, Any]
    mfa_policy: Dict[str, Any]
    data_retention_policy: Dict[str, Any]
    updated_at: datetime


# 3. API Key Management
class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    expiration_days: Optional[int] = Field(None, ge=1, le=365)


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime


class ApiKeyCreateResponse(BaseModel):
    api_key: ApiKeyResponse
    secret_key: str = Field(..., description="Shown only once upon key generation")


# 4. Integrations
class IntegrationResponse(BaseModel):
    id: str = Field(..., description="Integration identifier e.g. SIEM, EDR, CLOUD")
    name: str
    type: str
    status: str = Field(..., description="CONNECTED, DEGRADED, FAILED, DISCONNECTED")
    last_sync_at: Optional[datetime] = None
    last_error: Optional[str] = None
    configured: bool = Field(default=True)


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None


class IntegrationTestResponse(BaseModel):
    status: str = Field(..., description="CONNECTED, FAILED")
    latency_ms: float
    message: str


# 5. System Health
class ServiceHealthItem(BaseModel):
    name: str
    status: str = Field(..., description="Healthy, Degraded, Down, Unknown")
    latency_ms: Optional[float] = None
    version: Optional[str] = None
    error_rate_percentage: float = 0.0
    last_check_at: datetime


class SystemHealthResponse(BaseModel):
    api_status: str
    environment: str
    version: str
    services: List[ServiceHealthItem]
    timestamp: datetime


# 6. Usage Stats
class PlatformUsageResponse(BaseModel):
    active_users_count: int
    admin_users_count: int
    organizations_count: int
    pending_invitations_count: int
    critical_alerts_count: int
    failed_notifications_count: int
    audit_events_count: int
    integration_failures_count: int
    api_requests_count: int
    storage_bytes_used: int


class ApiUsageClientItem(BaseModel):
    client_name: str
    requests_count: int
    error_rate: float


class ApiUsageResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    rate_limits_triggered: int
    top_clients: List[ApiUsageClientItem]


# 7. Announcements
class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    message: str
    is_active: bool = Field(default=True)
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None


class AnnouncementResponse(AnnouncementCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# 8. Alert Rules
class AlertRuleCreate(BaseModel):
    rule_name: str = Field(..., min_length=2, max_length=100)
    event_type: str = Field(..., description="Risk, Vulnerability, Incident, compliance")
    condition: str = Field(..., description="e.g. Risk > 0.8, Critical Vulnerability > 0")
    severity: str = Field(default="HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    action: str = Field(..., description="e.g. Create Alert, Send Email, Create Incident")
    is_active: bool = Field(default=True)


class AlertRuleResponse(AlertRuleCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# 9. Background Jobs
class BackgroundJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    job_type: str
    status: str
    progress_percentage: int
    attempts: int
    max_attempts: int
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

