"""Pydantic schemas for Threat Intelligence, Feeds, IOCs, Threat Actors, and Campaigns (Phase 9)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field

from app.models.enums import RiskLevel


class ThreatSummaryResponse(BaseModel):
    """Executive KPI summary for Threat Intelligence."""
    active_threats: int
    critical_threats: int
    new_iocs: int
    malicious_ips: int
    malicious_domains: int
    affected_assets: int
    active_incidents: int
    threat_risk: float = Field(..., description="Overall threat exposure score (0 - 100)")
    threat_risk_level: RiskLevel
    total_feeds_active: int


class ThreatFeedItem(BaseModel):
    """Threat intelligence feed descriptor."""
    id: str
    name: str
    description: Optional[str] = None
    provider: str
    feed_type: str = Field(..., description="STIX/TAXII, IOC_FEED, MALWARE, VULNERABILITY, DARK_WEB, COMMERCIAL")
    status: str = Field("ACTIVE", description="ACTIVE, PAUSED, FAILED, DISABLED")
    last_updated: Optional[datetime] = None
    indicators_count: int = 0
    reliability: str = "HIGH"
    health: str = "HEALTHY"
    polling_interval_minutes: int = 60
    endpoint_url: Optional[str] = None
    last_successful_sync: Optional[datetime] = None
    last_failed_sync: Optional[datetime] = None
    sync_duration_seconds: Optional[float] = None


class ThreatFeedCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    provider: str = Field(..., min_length=2)
    feed_type: str
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    polling_interval_minutes: int = 60
    enabled: bool = True


class ThreatFeedUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    feed_type: Optional[str] = None
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    polling_interval_minutes: Optional[int] = None
    enabled: Optional[bool] = None


class ThreatFeedHealthResponse(BaseModel):
    feed_id: str
    feed_name: str
    health: str
    indicators_imported: int
    last_successful_sync: datetime
    last_sync_duration_seconds: float
    sync_errors_count: int
    status_message: str


class ThreatSourceItem(BaseModel):
    id: str
    name: str
    source_type: str
    reliability: str
    coverage_domains: List[str]
    last_updated: datetime
    status: str
    total_indicators: int


class IOCItem(BaseModel):
    """Indicator of Compromise record."""
    id: str
    indicator: str
    ioc_type: str = Field(..., description="IP, DOMAIN, URL, HASH_SHA256, HASH_MD5, EMAIL, CERTIFICATE, FILE, USERNAME")
    threat_classification: str
    confidence: str = Field("HIGH", description="CONFIRMED, HIGH, MEDIUM, LOW, UNKNOWN")
    severity: str = "HIGH"
    source: str
    first_seen: datetime
    last_seen: datetime
    status: str = Field("ACTIVE", description="ACTIVE, EXPIRED, BLOCKED, INVESTIGATING, FALSE_POSITIVE, ARCHIVED")
    related_events_count: int = 0
    affected_assets_count: int = 0
    threat_actor: Optional[str] = None
    mitre_techniques: List[str] = []


class IOCDetailResponse(IOCItem):
    """Deep inspection of an IOC."""
    sources: List[str]
    related_events: List[Dict[str, Any]] = []
    related_alerts: List[Dict[str, Any]] = []
    affected_assets: List[Dict[str, Any]] = []
    threat_actors: List[Dict[str, Any]] = []
    attack_paths: List[Dict[str, Any]] = []
    financial_exposure: float = 0.0


class IOCUpdate(BaseModel):
    status: Optional[str] = None
    confidence: Optional[str] = None
    severity: Optional[str] = None
    threat_classification: Optional[str] = None


class ThreatActorItem(BaseModel):
    """Adversary / Threat Actor profile."""
    id: str
    name: str
    aliases: List[str] = []
    motivation: str
    capability: str = "ADVANCED"
    target_sectors: List[str] = []
    mitre_techniques: List[str] = []
    active_campaigns_count: int = 0
    observed_activity_level: str = "HIGH"
    risk_score: float = 88.0
    first_observed: datetime
    last_observed: datetime


class ThreatActorDetailResponse(ThreatActorItem):
    """Detailed profile of a Threat Actor."""
    description: str
    known_iocs_count: int = 0
    known_iocs: List[Dict[str, Any]] = []
    campaigns: List[Dict[str, Any]] = []
    targeted_assets: List[Dict[str, Any]] = []
    attack_paths: List[Dict[str, Any]] = []
    financial_exposure: float = 0.0


class ThreatCampaignItem(BaseModel):
    """Active adversary campaign."""
    id: str
    name: str
    threat_actor_name: str
    threat_actor_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    targets: List[str] = []
    techniques: List[str] = []
    iocs_count: int = 0
    affected_assets_count: int = 0
    risk_score: float = 85.0
    status: str = "ACTIVE"


class ThreatCampaignDetailResponse(ThreatCampaignItem):
    description: str
    iocs: List[Dict[str, Any]] = []
    affected_assets: List[Dict[str, Any]] = []
    affected_business_services: List[Dict[str, Any]] = []
    related_alerts: List[Dict[str, Any]] = []
    related_incidents: List[Dict[str, Any]] = []
    financial_exposure: float = 0.0


class ThreatRiskResponse(BaseModel):
    """Threat risk posture and financial exposure."""
    threat_exposure_score: float
    critical_threats_count: int
    active_threat_actors_count: int
    active_campaigns_count: int
    targeted_assets_count: int
    compromised_assets_count: int
    financial_loss_exposure: float
    p90_loss_exposure: float


class ThreatActivityPoint(BaseModel):
    timestamp: datetime
    events_count: int
    alerts_count: int
    incidents_count: int
    ioc_matches_count: int
    threat_actor_activity_count: int


class ThreatActivityResponse(BaseModel):
    period: str
    points: List[ThreatActivityPoint]


class ThreatGeographyItem(BaseModel):
    source_country: str
    source_country_code: str
    destination_region: str
    threat_type: str
    event_count: int
    risk_level: RiskLevel


class ThreatWatchlistItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    item_type: str = Field(..., description="IP, DOMAIN, HASH, THREAT_ACTOR, CAMPAIGN, TECHNIQUE, ASSET")
    indicators: List[str] = []
    recent_matches_count: int = 0
    alerts_count: int = 0
    created_at: datetime
    status: str = "ACTIVE"


class ThreatWatchlistCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    item_type: str
    indicators: List[str] = []


class ThreatWatchlistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    indicators: Optional[List[str]] = None
    status: Optional[str] = None


class ThreatLandscapeReportResponse(BaseModel):
    executive_summary: str
    threat_landscape_summary: str
    critical_threats: List[Dict[str, Any]]
    top_threat_actors: List[Dict[str, Any]]
    active_campaigns: List[Dict[str, Any]]
    high_priority_iocs: List[Dict[str, Any]]
    affected_assets: List[Dict[str, Any]]
    total_financial_exposure: float
    recommended_defensive_actions: List[Dict[str, Any]]
    generated_at: datetime


class ThreatGlobalSearchResponse(BaseModel):
    query: str
    threat_actors: List[ThreatActorItem] = []
    iocs: List[IOCItem] = []
    campaigns: List[ThreatCampaignItem] = []
    events_count: int = 0
    alerts_count: int = 0
    assets_count: int = 0
