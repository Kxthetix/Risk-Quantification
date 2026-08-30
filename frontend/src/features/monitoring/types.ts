/**
 * Security Monitoring & Real-Time Event Telemetry TypeScript Types (Phase 9)
 */

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: "AUTH_FAILED" | "SUSPICIOUS_EXEC" | "RCE_ATTEMPT" | "PORT_SCAN" | "LATERAL_TRAVERSAL" | "PRIV_ESC" | "DATA_EXFIL" | string;
  source: "EDR" | "WAF" | "SIEM" | "FIREWALL" | "CLOUD_TRAIL" | "AUTH_SERVER" | "IDS" | string;
  source_ip?: string;
  destination_ip?: string;
  asset_id?: string;
  asset_name?: string;
  username?: string;
  process_name?: string;
  command_line?: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL" | string;
  detection_rule_id?: string;
  detection_rule_name?: string;
  threat_actor?: string;
  mitre_technique?: string;
  status: "DETECTED" | "ANALYZING" | "ALERT_GENERATED" | "RESOLVED" | "DROPPED" | string;
  raw_payload?: Record<string, any>;
}

export interface SecurityEventDetail extends SecurityEvent {
  affected_business_service?: string;
  attack_path_id?: string;
  attack_path_name?: string;
  financial_exposure: number;
  threat_intelligence_enrichment?: {
    ioc_indicator?: string;
    threat_actor?: string;
    confidence?: string;
    known_malicious_reputation_score?: number;
  };
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
}

export interface SecurityEventsListResponse {
  events: SecurityEvent[];
  total: number;
  page: number;
  page_size: number;
  events_per_second: number;
}

export interface MonitoringDashboard {
  events_per_second: number;
  total_events_today: number;
  active_alerts_count: number;
  critical_incidents_count: number;
  system_health_pct: number;
  threat_actors_detected: number;
  compromised_assets_count: number;
  critical_risk_score: number;
  processing_latency_ms: number;
  queue_size: number;
  dropped_events_count: number;
}

export interface DataSourceHealth {
  id: string;
  name: string;
  source_type: "SIEM" | "EDR" | "WAF" | "FIREWALL" | "CLOUD_LOGS" | "IDS_IPS" | "IDENTITY_PROVIDER" | "VULN_SCANNER" | string;
  status: "HEALTHY" | "DEGRADED" | "DISCONNECTED" | "ERROR" | string;
  events_per_minute: number;
  last_event_received: string;
  last_successful_connection: string;
  error_message?: string;
  throughput_mb_per_sec: number;
}

export interface MonitoringHealth {
  connected_sources_count: number;
  disconnected_sources_count: number;
  event_processing_status: string;
  detection_engine_status: string;
  threat_feeds_status: string;
  avg_processing_latency_ms: number;
  buffer_memory_usage_pct: number;
  data_sources: DataSourceHealth[];
}

export type ConnectionState = "Connected" | "Connecting" | "Reconnecting" | "Disconnected" | "Failed";
