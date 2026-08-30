"""Pydantic schemas for Detection Rules & Engine Simulation (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class DetectionRuleItem(BaseModel):
    """Detection rule descriptor."""
    id: str
    name: str
    description: str
    severity: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL")
    source: str = Field("SIEM", description="SIEM, EDR, WAF, NETWORK, CLOUD")
    mitre_technique: str
    mitre_tactic: str
    status: str = Field("ENABLED", description="ENABLED, DISABLED, TESTING")
    matches_count: int = 0
    last_triggered: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DetectionRuleDetailResponse(DetectionRuleItem):
    """Full detail of a detection rule including detection logic."""
    detection_logic: str = Field(..., description="Query, regex, Sigma, or YARA rule expression")
    data_sources: List[str] = []
    false_positive_rate_pct: float = 2.1
    triggered_alerts: List[Dict[str, Any]] = []


class DetectionRuleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str
    severity: str = "HIGH"
    source: str = "SIEM"
    mitre_technique: str
    mitre_tactic: str
    detection_logic: str = Field(..., min_length=5)
    data_sources: List[str] = []
    enabled: bool = True


class DetectionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    source: Optional[str] = None
    mitre_technique: Optional[str] = None
    mitre_tactic: Optional[str] = None
    detection_logic: Optional[str] = None
    data_sources: Optional[List[str]] = None
    enabled: Optional[bool] = None


class DetectionRuleTestRequest(BaseModel):
    rule_logic: Optional[str] = None
    sample_event_payload: Dict[str, Any]


class DetectionRuleTestResponse(BaseModel):
    matched: bool
    execution_time_ms: float
    matched_conditions: List[str] = []
    extracted_fields: Dict[str, Any] = {}
    rule_status: str = "SUCCESS"
    error_message: Optional[str] = None
