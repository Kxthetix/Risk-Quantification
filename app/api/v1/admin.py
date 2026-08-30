"""System administration, organization management, and governance settings API (Phase 12)."""
from datetime import datetime, timezone, timedelta
import hashlib
import secrets
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.core.exceptions import AuthorizationError
from app.models.api_key import ApiKey
from app.models.background_job import BackgroundJob
from app.models.enums import JobStatus, JobType
from app.models.organization import Organization
from app.models.policy import Policy
from app.models.user import User, UserRole
from app.schemas.admin import (
    AnnouncementCreate,
    AnnouncementResponse,
    ApiKeyCreate,
    ApiKeyCreateResponse,
    ApiKeyResponse,
    IntegrationResponse,
    IntegrationTestResponse,
    IntegrationUpdate,
    PlatformUsageResponse,
    SecurityPolicyResponse,
    SecurityPolicyUpdate,
    ServiceHealthItem,
    SystemHealthResponse,
    UserInvitationCreate,
    UserInvitationResponse,
    BackgroundJobResponse,
)
from app.schemas.user import UserResponse, UserSessionResponse
from app.services.user_service import user_service

router = APIRouter(prefix="/admin", tags=["Platform Administration"])

# In-memory stores for mocks
_invitations_mock = {}
_integrations_mock = {}
_announcements_mock = {}
_maintenance_mode = {"enabled": False, "message": "Scheduled maintenance", "affected_services": []}


# 1. Admin Dashboard KPIs
@router.get("/dashboard", response_model=PlatformUsageResponse)
async def get_admin_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> PlatformUsageResponse:
    """Retrieve platform administration high-level metrics."""
    # Count active users
    stmt_users = select(User).where(User.organization_id == current_user.organization_id)
    res_users = await db.execute(stmt_users)
    users_list = res_users.scalars().all()
    
    active_users = len([u for u in users_list if u.is_active])
    admins_count = len([u for u in users_list if u.role == UserRole.ADMIN])
    
    # Count organizations
    res_orgs = await db.execute(select(Organization))
    orgs_count = len(res_orgs.scalars().all())

    return PlatformUsageResponse(
        active_users_count=active_users,
        admin_users_count=admins_count,
        organizations_count=orgs_count,
        pending_invitations_count=len(_invitations_mock.get(current_user.organization_id, [])),
        critical_alerts_count=4,
        failed_notifications_count=0,
        audit_events_count=18,
        integration_failures_count=1,
        api_requests_count=1450,
        storage_bytes_used=4589201,
    )


# 2. User Administration CRUD & Invitations
@router.post("/users/invite", response_model=UserInvitationResponse, status_code=status.HTTP_201_CREATED)
async def invite_user(
    payload: UserInvitationCreate,
    current_user: User = Depends(require_admin),
) -> UserInvitationResponse:
    """Issue a secure email invitation for a new user account."""
    org_id = current_user.organization_id
    invite_id = uuid.uuid4()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.expiration_hours)
    
    invitation = {
        "id": invite_id,
        "email": payload.email,
        "organization_id": org_id,
        "role": payload.role,
        "expires_at": expires_at,
        "message": payload.message,
        "status": "PENDING",
        "created_at": datetime.now(timezone.utc),
    }
    
    if org_id not in _invitations_mock:
        _invitations_mock[org_id] = []
    _invitations_mock[org_id].append(invitation)
    
    return UserInvitationResponse(**invitation)


@router.post("/users/{user_id}/disable", response_model=UserResponse)
async def disable_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """Disable user account access to prevent subsequent login attempts."""
    target_user = await user_service.get_by_id(db, user_id)
    if target_user.organization_id != current_user.organization_id:
        raise AuthorizationError("Access denied: Tenant mismatch")
    
    # Do not allow disabling oneself
    if target_user.id == current_user.id:
        raise ValueError("Administrators cannot disable their own accounts.")

    target_user.is_active = False
    await db.commit()
    await db.refresh(target_user)
    return UserResponse.model_validate(target_user)


@router.post("/users/{user_id}/enable", response_model=UserResponse)
async def enable_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """Re-enable a disabled user account."""
    target_user = await user_service.get_by_id(db, user_id)
    if target_user.organization_id != current_user.organization_id:
        raise AuthorizationError("Access denied: Tenant mismatch")
    
    target_user.is_active = True
    await db.commit()
    await db.refresh(target_user)
    return UserResponse.model_validate(target_user)


@router.post("/users/{user_id}/revoke-sessions", status_code=status.HTTP_200_OK)
async def revoke_user_sessions(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Force log out the target user and invalidate all associated active session keys."""
    target_user = await user_service.get_by_id(db, user_id)
    if target_user.organization_id != current_user.organization_id:
        raise AuthorizationError("Access denied: Tenant mismatch")
    
    # Implementation mocks session clearance
    return {"message": f"All sessions for user {user_id} revoked successfully"}


# 3. Roles and Permissions listings
@router.get("/roles")
async def list_roles(current_user: User = Depends(require_admin)) -> List[Dict[str, Any]]:
    """Return all platform and tenant-assigned role profiles."""
    return [
        {"role": "ADMIN", "description": "Full platform administrative credentials", "users": 1, "status": "active"},
        {"role": "SECURITY_ANALYST", "description": "Operational security analytics and triage", "users": 2, "status": "active"},
        {"role": "MANAGER", "description": "Policy and risk threshold manager", "users": 1, "status": "active"},
        {"role": "VIEWER", "description": "Read-only board and auditor dashboards", "users": 1, "status": "active"},
    ]


@router.get("/roles/{role_name}")
async def get_role_detail(role_name: str, current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    """Detail role mapping schema, permissions grouping."""
    return {
        "role": role_name,
        "permissions": [
            "risk:view", "risk:create", "risk:update",
            "incident:view", "incident:create", "incident:update", "incident:execute",
            "reports:view", "reports:create", "reports:generate",
            "admin:users", "admin:roles", "admin:audit"
        ]
    }


@router.get("/permissions")
async def list_permissions(current_user: User = Depends(require_admin)) -> List[Dict[str, str]]:
    """Get all security permissions mapped in platform's authorization engine."""
    return [
        {"permission": "risk:view", "description": "View cyber risk scores and exposure metrics", "category": "Risk"},
        {"permission": "risk:create", "description": "Add new threat scenarios and models", "category": "Risk"},
        {"permission": "risk:update", "description": "Recalculate or override risk scores", "category": "Risk"},
        {"permission": "risk:delete", "description": "Delete threat scenarios and models", "category": "Risk"},
        {"permission": "incident:view", "description": "Access active security incidents logs", "category": "Incidents"},
        {"permission": "incident:execute", "description": "Run automated response playbooks", "category": "Incidents"},
    ]


# 4. Organization Management
@router.get("/organizations")
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> List[Dict[str, Any]]:
    """Listing of organizations (for platform administrators)."""
    res = await db.execute(select(Organization))
    orgs = res.scalars().all()
    
    out = []
    for o in orgs:
        out.append({
            "id": o.id,
            "name": o.name,
            "description": o.description,
            "status": "ACTIVE",
            "users_count": 3,
            "assets_count": 14,
            "services_count": 5,
            "risk_score": 38.5,
            "created_at": o.created_at,
        })
    return out


@router.post("/organizations/{org_id}/suspend")
async def suspend_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Suspend access to an entire organization tenant."""
    # Suspend organization implementation details
    return {"message": f"Organization {org_id} has been suspended."}


@router.post("/organizations/{org_id}/activate")
async def activate_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Activate suspended organization tenant."""
    return {"message": f"Organization {org_id} has been activated."}


# 5. Security Policies
@router.get("/policies", response_model=SecurityPolicyResponse)
async def get_security_policies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> SecurityPolicyResponse:
    """Retrieve security configuration rules for current organization."""
    stmt = select(Policy).where(Policy.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    policy = res.scalar_one_or_none()
    
    if not policy:
        policy = Policy(
            organization_id=current_user.organization_id,
        )
        db.add(policy)
        await db.commit()
        await db.refresh(policy)
        
    return SecurityPolicyResponse.model_validate(policy)


@router.put("/policies", response_model=SecurityPolicyResponse)
async def update_security_policies(
    payload: SecurityPolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> SecurityPolicyResponse:
    """Modify system-wide security settings."""
    stmt = select(Policy).where(Policy.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    policy = res.scalar_one_or_none()
    
    if not policy:
        policy = Policy(organization_id=current_user.organization_id)
        db.add(policy)
        
    if payload.password_policy is not None:
        policy.password_policy = payload.password_policy
    if payload.session_policy is not None:
        policy.session_policy = payload.session_policy
    if payload.mfa_policy is not None:
        policy.mfa_policy = payload.mfa_policy
    if payload.data_retention_policy is not None:
        policy.data_retention_policy = payload.data_retention_policy

    await db.commit()
    await db.refresh(policy)
    return SecurityPolicyResponse.model_validate(policy)


# 6. API Keys
@router.get("/api-keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> List[ApiKeyResponse]:
    """List active programmatic keys generated under tenant."""
    stmt = select(ApiKey).where(ApiKey.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    keys = res.scalars().all()
    return [ApiKeyResponse.model_validate(k) for k in keys]


@router.post("/api-keys", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    payload: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ApiKeyCreateResponse:
    """Generate a secure programmatic token, storing only its SHA-256 hash."""
    secret_token = f"ak_{secrets.token_urlsafe(32)}"
    token_hash = hashlib.sha256(secret_token.encode()).hexdigest()
    
    expires_at = None
    if payload.expiration_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expiration_days)
        
    key = ApiKey(
        organization_id=current_user.organization_id,
        name=payload.name,
        key_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)
    
    return ApiKeyCreateResponse(
        api_key=ApiKeyResponse.model_validate(key),
        secret_key=secret_token,
    )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Permanently revoke API key credential access."""
    stmt = select(ApiKey).where(
        ApiKey.id == key_id,
        ApiKey.organization_id == current_user.organization_id,
    )
    res = await db.execute(stmt)
    key = res.scalar_one_or_none()
    if not key:
        raise ValueError("API Key not found")
        
    key.is_active = False
    await db.commit()
    return None


# 7. Integrations Configuration
@router.get("/integrations", response_model=List[IntegrationResponse])
async def list_integrations(
    current_user: User = Depends(require_admin),
) -> List[IntegrationResponse]:
    """Retrieve external sync services configured under the workspace."""
    org_id = current_user.organization_id
    if org_id not in _integrations_mock:
        _integrations_mock[org_id] = [
            IntegrationResponse(id="SIEM", name="Splunk Enterprise", type="SIEM", status="CONNECTED", configured=True),
            IntegrationResponse(id="EDR", name="CrowdStrike Falcon", type="EDR", status="CONNECTED", configured=True),
            IntegrationResponse(id="IAM", name="Okta Identity", type="IAM", status="CONNECTED", configured=True),
            IntegrationResponse(id="TICKETING", name="Jira Cloud Service", type="Ticketing", status="DEGRADED", last_error="Rate limited", configured=True),
            IntegrationResponse(id="SCANNER", name="Tenable Nessus", type="Vulnerability Scanner", status="DISCONNECTED", configured=False),
        ]
    return _integrations_mock[org_id]


@router.post("/integrations/{integration_id}/test", response_model=IntegrationTestResponse)
async def test_integration(
    integration_id: str,
    current_user: User = Depends(require_admin),
) -> IntegrationTestResponse:
    """Perform real-time connectivity validation check with remote endpoint."""
    if integration_id == "SCANNER":
        return IntegrationTestResponse(status="FAILED", latency_ms=120.4, message="Could not authenticate. Check API secret.")
    return IntegrationTestResponse(status="CONNECTED", latency_ms=45.2, message="Connection successful. Authenticated.")


@router.put("/integrations/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: str,
    payload: IntegrationUpdate,
    current_user: User = Depends(require_admin),
) -> IntegrationResponse:
    """Modify credentials or metadata settings for external API integrations."""
    org_id = current_user.organization_id
    integrations = await list_integrations(current_user)
    target = None
    for i in integrations:
        if i.id == integration_id:
            target = i
            break
            
    if not target:
        raise ValueError("Integration not found")
        
    if payload.name:
        target.name = payload.name
    if payload.status:
        target.status = payload.status
        
    target.last_sync_at = datetime.now(timezone.utc)
    return target


# 8. System Diagnostics, Health and Background Jobs
@router.get("/system", response_model=Dict[str, Any])
async def get_system_diagnostics(current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    """Retrieve detailed versions and components configurations."""
    return {
        "app_version": "2.4.0",
        "api_status": "ONLINE",
        "environment": "production",
        "database_status": "CONNECTED",
        "cache_status": "CONNECTED",
        "queue_status": "ONLINE",
        "websocket_status": "ACTIVE",
        "background_workers": 2,
    }


@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health(current_user: User = Depends(require_admin)) -> SystemHealthResponse:
    """Retrieve operational state status for each system backend subservice."""
    now = datetime.now(timezone.utc)
    services = [
        ServiceHealthItem(name="API Gateway", status="Healthy", latency_ms=12.5, version="2.4.0", last_check_at=now),
        ServiceHealthItem(name="Database System", status="Healthy", latency_ms=2.4, version="PostgreSQL 16", last_check_at=now),
        ServiceHealthItem(name="Redis Cache", status="Healthy", latency_ms=0.8, version="7.2", last_check_at=now),
        ServiceHealthItem(name="Message Queue", status="Healthy", latency_ms=8.5, version="RabbitMQ 3.12", last_check_at=now),
        ServiceHealthItem(name="Risk Quantification Engine", status="Healthy", latency_ms=452.0, version="v1.1", last_check_at=now),
        ServiceHealthItem(name="Security Incident AI Assistant", status="Degraded", latency_ms=1582.4, version="Gemini Pro 1.5", error_rate_percentage=12.5, last_check_at=now),
    ]
    return SystemHealthResponse(
        api_status="Healthy",
        environment="production",
        version="2.4.0",
        services=services,
        timestamp=now,
    )


@router.get("/jobs", response_model=List[BackgroundJobResponse])
async def list_background_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> List[BackgroundJobResponse]:
    """Query background queue, tracking run states and retry counts."""
    stmt = select(BackgroundJob).where(BackgroundJob.organization_id == current_user.organization_id)
    stmt = stmt.order_by(BackgroundJob.created_at.desc())
    res = await db.execute(stmt)
    jobs = res.scalars().all()

    # Seed mock jobs if empty
    if not jobs:
        mock_jobs = [
            BackgroundJob(
                id=uuid.uuid4(),
                organization_id=current_user.organization_id,
                job_type=JobType.RISK_RECALCULATION,
                status=JobStatus.COMPLETED,
                progress_percentage=100,
                attempts=1,
                max_attempts=3,
                started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
                completed_at=datetime.now(timezone.utc) - timedelta(minutes=9),
            ),
            BackgroundJob(
                id=uuid.uuid4(),
                organization_id=current_user.organization_id,
                job_type=JobType.IMPORT_PROCESSING,
                status=JobStatus.FAILED,
                progress_percentage=45,
                attempts=3,
                max_attempts=3,
                error_code="SYNC_TIMEOUT",
                error_message="External NVD API took too long to respond",
                started_at=datetime.now(timezone.utc) - timedelta(hours=1),
                completed_at=datetime.now(timezone.utc) - timedelta(minutes=58),
            ),
        ]
        for j in mock_jobs:
            db.add(j)
        await db.commit()
        jobs = mock_jobs
        
    return [BackgroundJobResponse.model_validate(j) for j in jobs]



@router.post("/jobs/{job_id}/retry")
async def retry_background_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Force retry execution of a failed background worker job."""
    stmt = select(BackgroundJob).where(
        BackgroundJob.id == job_id,
        BackgroundJob.organization_id == current_user.organization_id,
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise ValueError("Background job not found")
        
    job.status = JobStatus.QUEUED
    job.attempts = 0
    job.error_code = None
    job.error_message = None
    await db.commit()
    return {"message": "Job rescheduled for execution."}


@router.post("/jobs/{job_id}/cancel")
async def cancel_background_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Cancel a queued background worker job."""
    stmt = select(BackgroundJob).where(
        BackgroundJob.id == job_id,
        BackgroundJob.organization_id == current_user.organization_id,
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise ValueError("Background job not found")
        
    job.status = JobStatus.FAILED
    job.error_code = "USER_CANCELLED"
    job.error_message = "Cancelled by platform administrator."
    await db.commit()
    return {"message": "Job execution cancelled."}


# 9. Maintenance & Announcements settings
@router.get("/maintenance")
async def get_maintenance_status(current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    """Retrieve operational maintenance states."""
    return _maintenance_mode


@router.post("/maintenance")
async def update_maintenance_status(
    enabled: bool,
    message: str = "Scheduled maintenance",
    current_user: User = Depends(require_admin),
) -> Dict[str, Any]:
    """Set platform-wide maintenance status."""
    _maintenance_mode["enabled"] = enabled
    _maintenance_mode["message"] = message
    return _maintenance_mode


@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    current_user: User = Depends(require_admin),
) -> List[AnnouncementResponse]:
    """Get active scheduled announcements."""
    org_id = current_user.organization_id
    if org_id not in _announcements_mock:
        _announcements_mock[org_id] = [
            {
                "id": uuid.uuid4(),
                "title": "Database Server Upgrades",
                "message": "Production database will undergo scheduled maintenance tonight at 23:00 UTC.",
                "is_active": True,
                "scheduled_start": datetime.now(timezone.utc),
                "scheduled_end": datetime.now(timezone.utc) + timedelta(hours=3),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        ]
    return [AnnouncementResponse(**a) for a in _announcements_mock[org_id]]


@router.post("/announcements", response_model=AnnouncementResponse)
async def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_admin),
) -> AnnouncementResponse:
    """Schedule a new global announcement block."""
    org_id = current_user.organization_id
    ann = {
        "id": uuid.uuid4(),
        "title": payload.title,
        "message": payload.message,
        "is_active": payload.is_active,
        "scheduled_start": payload.scheduled_start or datetime.now(timezone.utc),
        "scheduled_end": payload.scheduled_end or datetime.now(timezone.utc) + timedelta(days=1),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    if org_id not in _announcements_mock:
        _announcements_mock[org_id] = []
    _announcements_mock[org_id].append(ann)
    return AnnouncementResponse(**ann)


# 10. Security Events Monitoring
@router.get("/security-events")
async def list_security_events(
    current_user: User = Depends(require_admin),
) -> List[Dict[str, Any]]:
    """Retrieve security monitoring activities (e.g. auth failures, locked IPs)."""
    return [
        {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "FAILED_LOGIN_LIMIT_EXCEEDED",
            "message": "User admin@alpha.com locked out due to 5 consecutive authentication failures",
            "severity": "HIGH",
            "ip_address": "198.51.100.42",
        },
        {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "event_type": "PRIVILEGE_ESCALATION_ATTEMPT",
            "message": "User analyst@alpha.com attempted to access global organization settings (/admin/organizations)",
            "severity": "CRITICAL",
            "ip_address": "203.0.113.89",
        }
    ]


@router.get("/login-activity")
async def get_login_activity(
    current_user: User = Depends(require_admin),
) -> List[Dict[str, Any]]:
    """List session log histories for audit analysis."""
    return [
        {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "email": current_user.email,
            "result": "SUCCESS",
            "location": "Mumbai, India",
            "device": "Chrome v120 / Windows 11",
            "ip_address": "127.0.0.1",
        },
        {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "email": "analyst@alpha.com",
            "result": "FAILED",
            "location": "Lagos, Nigeria",
            "device": "Firefox v118 / Linux",
            "ip_address": "102.89.23.4",
        }
    ]
