/**
 * Security & Risk Alerts TypeScript Types (Phase 9)
 */

export interface AlertSummary {
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  open_alerts: number;
  investigating_alerts: number;
  resolved_alerts: number;
  false_positives_count: number;
  mttd_minutes: number;
  mtta_minutes: number;
  mttr_minutes: number;
  false_positive_rate_pct: number;
}

export interface DetailedAlert {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL" | string;
  source: string;
  status: "NEW" | "ACKNOWLEDGED" | "INVESTIGATING" | "CONTAINED" | "RESOLVED" | "CLOSED" | "FALSE_POSITIVE" | string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  assigned_to?: string;
  assigned_at?: string;
  asset_id?: string;
  asset_name?: string;
  ioc_indicator?: string;
  threat_actor?: string;
  mitre_technique?: string;
  mitre_tactic?: string;
  risk_score: number;
  financial_impact: number;
  created_at: string;
  updated_at: string;
}

export interface AlertDetail extends DetailedAlert {
  detection_rule_id?: string;
  detection_rule_name?: string;
  related_events: Array<{
    event_id: string;
    type: string;
    source: string;
    timestamp: string;
  }>;
  related_alerts: Array<{
    alert_id: string;
    title: string;
    severity: string;
  }>;
  attack_path_id?: string;
  attack_path_name?: string;
  business_service_id?: string;
  business_service_name?: string;
  incident_id?: string;
  incident_title?: string;
  resolution_notes?: string;
  false_positive_reason?: string;
  timeline_events: Array<{
    timestamp: string;
    action: string;
    actor: string;
    details: string;
  }>;
}

export interface AlertCorrelationGroup {
  group_key: string;
  common_attribute: string;
  attribute_value: string;
  alerts_count: number;
  first_seen: string;
  last_seen: string;
  max_severity: string;
  alerts: DetailedAlert[];
}
