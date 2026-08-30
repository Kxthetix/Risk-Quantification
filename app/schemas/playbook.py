"""Pydantic schemas for SOAR Response Playbooks, Workflows, Execution Traces & Rollbacks (Phase 10)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PlaybookStep(BaseModel):
    step_id: str
    step_number: int
    name: str
    action_type: str = Field(
        ...,
        description="ISOLATE_ASSET, BLOCK_IP, BLOCK_DOMAIN, DISABLE_ACCOUNT, REVOKE_SESSION, RESET_CREDENTIAL, QUARANTINE_FILE, CREATE_TICKET, SEND_NOTIFICATION, COLLECT_EVIDENCE, RUN_SCAN, UPDATE_FIREWALL, RECALCULATE_RISK"
    )
    target_type: str = Field("ASSET", description="ASSET, IP, DOMAIN, USER, SYSTEM")
    default_target: Optional[str] = None
    requires_approval: bool = False
    is_high_risk: bool = False
    condition: Optional[str] = None
    timeout_seconds: int = 60
    rollback_action: Optional[str] = None


class PlaybookItem(BaseModel):
    id: str
    name: str
    description: str
    category: str = Field(
        ...,
        description="Phishing Response, Malware Response, Credential Compromise, Ransomware, Suspicious Login, Data Exfiltration, Endpoint Compromise, Cloud Account Compromise, Network Attack, Vulnerability Exploitation"
    )
    trigger_type: str = Field("AUTOMATIC", description="AUTOMATIC, MANUAL, SCHEDULED")
    status: str = Field("ENABLED", description="ENABLED, DISABLED, DRAFT")
    execution_count: int = 0
    success_rate_pct: float = 100.0
    avg_duration_seconds: float = 4.5
    steps_count: int = 0
    created_at: datetime
    updated_at: datetime


class PlaybookDetailResponse(PlaybookItem):
    steps: List[PlaybookStep] = []
    required_permissions: List[str] = []
    approval_requirements: Optional[str] = None
    configured_integrations: List[str] = []
    estimated_risk_reduction_pct: float = 45.0


class PlaybookCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    category: str
    trigger_type: str = "MANUAL"
    status: str = "ENABLED"
    steps: List[PlaybookStep] = []
    required_permissions: List[str] = []


class PlaybookUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    steps: Optional[List[PlaybookStep]] = None


class PlaybookExecutionRequest(BaseModel):
    incident_id: Optional[str] = None
    target_parameters: Dict[str, Any] = {}
    dry_run: bool = False


class PlaybookExecutionStepTrace(BaseModel):
    step_id: str
    step_number: int
    name: str
    action_type: str
    target: str
    status: str = Field("QUEUED", description="QUEUED, RUNNING, WAITING_FOR_APPROVAL, SUCCEEDED, FAILED, SKIPPED, ROLLED_BACK")
    requires_approval: bool = False
    is_high_risk: bool = False
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    result: Optional[str] = None
    error_message: Optional[str] = None


class PlaybookExecutionResponse(BaseModel):
    execution_id: str
    playbook_id: str
    playbook_name: str
    incident_id: Optional[str] = None
    status: str = Field("RUNNING", description="QUEUED, RUNNING, WAITING_FOR_APPROVAL, PAUSED, SUCCEEDED, PARTIALLY_SUCCEEDED, FAILED, CANCELLED")
    dry_run: bool = False
    started_by: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    steps_executed: int
    total_steps: int
    current_step_name: Optional[str] = None
    steps: List[PlaybookExecutionStepTrace] = []
    risk_before_score: float = 75.0
    risk_after_score: Optional[float] = None
    financial_exposure_reduced: float = 0.0


class PlaybookRetryRequest(BaseModel):
    step_id: str
    force_override: bool = False


class PlaybookRollbackRequest(BaseModel):
    reason: str = Field(..., min_length=3)
    authorized_by: str
