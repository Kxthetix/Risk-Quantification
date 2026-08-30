"""Pydantic schemas for Real-Time Security Monitoring & Event Streams (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field

from app.models.enums import RiskLevel


class SecurityEventItem(BaseModel):
    """Normalized real-time security event telemetry record."""
    id: str
    timestamp: datetime
    event_type: str = Field(..., description="AUTH_FAILED, SUSPICIOUS_EXEC, RCE_ATTEMPT, PORT_SCAN, LATERAL_TRAVERSAL, PRIV_ESC, DATA_EXFIL")
    source: str = Field(..., description="EDR, WAF, SIEM, FIREWALL, CLOUD_TRAIL, AUTH_SERVER, IDS")
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    username: Optional[str] = None
    process_name: Optional[str] = None
    command_line: Optional[str] = None
    severity: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL")
    detection_rule_id: Optional[str] = None
    detection_rule_name: Optional[str] = None
    threat_actor: Optional[str] = None
    mitre_technique: Optional[str] = None
    status: str = Field("DETECTED", description="DETECTED, ANALYZING, ALERT_GENERATED, RESOLVED, DROPPED")
    raw_payload: Optional[Dict[str, Any]] = None


class SecurityEventDetailResponse(SecurityEventItem):
    """Deep inspection of a security event."""
    affected_business_service: Optional[str] = None
    attack_path_id: Optional[str] = None
    attack_path_name: Optional[str] = None
    financial_exposure: float = 0.0
    threat_intelligence_enrichment: Optional[Dict[str, Any]] = None
    related_alerts: List[Dict[str, Any]] = []
    related_incidents: List[Dict[str, Any]] = []


class SecurityEventsListResponse(BaseModel):
    events: List[SecurityEventItem]
    total: int
    page: int
    page_size: int
    events_per_second: float = 42.5


class MonitoringDashboardResponse(BaseModel):
    """Overview metrics for security monitoring center."""
    events_per_second: float
    total_events_today: int
    active_alerts_count: int
    critical_incidents_count: int
    system_health_pct: float
    threat_actors_detected: int
    compromised_assets_count: int
    critical_risk_score: float
    processing_latency_ms: float
    queue_size: int
    dropped_events_count: int


class DataSourceHealthItem(BaseModel):
    id: str
    name: str
    source_type: str = Field(..., description="SIEM, EDR, WAF, FIREWALL, CLOUD_LOGS, IDS_IPS, IDENTITY_PROVIDER, VULN_SCANNER")
    status: str = Field("HEALTHY", description="HEALTHY, DEGRADED, DISCONNECTED, ERROR")
    events_per_minute: int
    last_event_received: datetime
    last_successful_connection: datetime
    error_message: Optional[str] = None
    throughput_mb_per_sec: float


class MonitoringHealthResponse(BaseModel):
    connected_sources_count: int
    disconnected_sources_count: int
    event_processing_status: str
    detection_engine_status: str
    threat_feeds_status: str
    avg_processing_latency_ms: float
    buffer_memory_usage_pct: float
    data_sources: List[DataSourceHealthItem]
