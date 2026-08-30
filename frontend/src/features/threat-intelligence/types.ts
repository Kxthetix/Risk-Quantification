/**
 * Threat Intelligence TypeScript Types (Phase 9)
 */

export interface ThreatSummary {
  active_threats: number;
  critical_threats: number;
  new_iocs: number;
  malicious_ips: number;
  malicious_domains: number;
  affected_assets: number;
  active_incidents: number;
  threat_risk: number;
  threat_risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  total_feeds_active: number;
}

export interface ThreatFeed {
  id: string;
  name: string;
  description?: string;
  provider: string;
  feed_type: "STIX/TAXII" | "IOC_FEED" | "MALWARE" | "VULNERABILITY" | "DARK_WEB" | "COMMERCIAL" | string;
  status: "ACTIVE" | "PAUSED" | "FAILED" | "DISABLED" | string;
  last_updated?: string;
  indicators_count: number;
  reliability: string;
  health: "HEALTHY" | "DEGRADED" | "DOWN" | string;
  polling_interval_minutes: number;
  endpoint_url?: string;
  last_successful_sync?: string;
  last_failed_sync?: string;
  sync_duration_seconds?: number;
}

export interface ThreatFeedHealth {
  feed_id: string;
  feed_name: string;
  health: string;
  indicators_imported: number;
  last_successful_sync: string;
  last_sync_duration_seconds: number;
  sync_errors_count: number;
  status_message: string;
}

export interface ThreatSource {
  id: string;
  name: string;
  source_type: string;
  reliability: string;
  coverage_domains: string[];
  last_updated: string;
  status: string;
  total_indicators: number;
}

export interface IOCItem {
  id: string;
  indicator: string;
  ioc_type: "IP" | "DOMAIN" | "URL" | "HASH_SHA256" | "HASH_MD5" | "EMAIL" | "CERTIFICATE" | "FILE" | "USERNAME" | string;
  threat_classification: string;
  confidence: "CONFIRMED" | "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN" | string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL" | string;
  source: string;
  first_seen: string;
  last_seen: string;
  status: "ACTIVE" | "EXPIRED" | "BLOCKED" | "INVESTIGATING" | "FALSE_POSITIVE" | "ARCHIVED" | string;
  related_events_count: number;
  affected_assets_count: number;
  threat_actor?: string;
  mitre_techniques: string[];
}

export interface IOCDetail extends IOCItem {
  sources: string[];
  related_events: Array<{
    event_id: string;
    type: string;
    source_ip?: string;
    timestamp: string;
  }>;
  related_alerts: Array<{
    alert_id: string;
    title: string;
    severity: string;
  }>;
  affected_assets: Array<{
    asset_id: string;
    name: string;
    ip?: string;
    criticality?: string;
  }>;
  threat_actors: Array<{
    actor_id: string;
    name: string;
    motivation?: string;
  }>;
  attack_paths: Array<{
    path_id: string;
    name: string;
    risk_score: number;
  }>;
  financial_exposure: number;
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  motivation: string;
  capability: "ELITE" | "ADVANCED" | "INTERMEDIATE" | "BASIC" | string;
  target_sectors: string[];
  mitre_techniques: string[];
  active_campaigns_count: number;
  observed_activity_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  risk_score: number;
  first_observed: string;
  last_observed: string;
}

export interface ThreatActorDetail extends ThreatActor {
  description: string;
  known_iocs_count: number;
  known_iocs: Array<{
    indicator: string;
    type: string;
    confidence: string;
  }>;
  campaigns: Array<{
    campaign_id: string;
    name: string;
    status: string;
  }>;
  targeted_assets: Array<{
    asset_id: string;
    name: string;
    criticality?: string;
  }>;
  attack_paths: Array<{
    path_id: string;
    name: string;
    risk_score: number;
  }>;
  financial_exposure: number;
}

export interface ThreatCampaign {
  id: string;
  name: string;
  threat_actor_name: string;
  threat_actor_id: string;
  start_date: string;
  end_date?: string;
  targets: string[];
  techniques: string[];
  iocs_count: number;
  affected_assets_count: number;
  risk_score: number;
  status: "ACTIVE" | "CONTAINED" | "CONCLUDED" | string;
}

export interface ThreatCampaignDetail extends ThreatCampaign {
  description: string;
  iocs: Array<{
    indicator: string;
    type: string;
    severity: string;
  }>;
  affected_assets: Array<{
    asset_id: string;
    name: string;
    ip?: string;
  }>;
  affected_business_services: Array<{
    service_id: string;
    name: string;
    criticality?: string;
  }>;
  related_alerts: Array<{
    alert_id: string;
    title: string;
    severity: string;
  }>;
  related_incidents: Array<{
    incident_id: string;
    title: string;
    status: string;
  }>;
  financial_exposure: number;
}

export interface ThreatRisk {
  threat_exposure_score: number;
  critical_threats_count: number;
  active_threat_actors_count: number;
  active_campaigns_count: number;
  targeted_assets_count: number;
  compromised_assets_count: number;
  financial_loss_exposure: number;
  p90_loss_exposure: number;
}

export interface ThreatActivityPoint {
  timestamp: string;
  events_count: number;
  alerts_count: number;
  incidents_count: number;
  ioc_matches_count: number;
  threat_actor_activity_count: number;
}

export interface ThreatActivity {
  period: string;
  points: ThreatActivityPoint[];
}

export interface ThreatGeographyItem {
  source_country: string;
  source_country_code: string;
  destination_region: string;
  threat_type: string;
  event_count: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

export interface ThreatWatchlist {
  id: string;
  name: string;
  description?: string;
  item_type: "IP" | "DOMAIN" | "HASH" | "THREAT_ACTOR" | "CAMPAIGN" | "TECHNIQUE" | "ASSET" | string;
  indicators: string[];
  recent_matches_count: number;
  alerts_count: number;
  created_at: string;
  status: string;
}

export interface ThreatLandscapeReport {
  executive_summary: string;
  threat_landscape_summary: string;
  critical_threats: Array<Record<string, any>>;
  top_threat_actors: Array<Record<string, any>>;
  active_campaigns: Array<Record<string, any>>;
  high_priority_iocs: Array<Record<string, any>>;
  affected_assets: Array<Record<string, any>>;
  total_financial_exposure: number;
  recommended_defensive_actions: Array<Record<string, any>>;
  generated_at: string;
}

export interface ThreatGlobalSearch {
  query: string;
  threat_actors: ThreatActor[];
  iocs: IOCItem[];
  campaigns: ThreatCampaign[];
  events_count: number;
  alerts_count: number;
  assets_count: number;
}
