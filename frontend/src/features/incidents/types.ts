/**
 * Incident Response & Management TypeScript Types (Phase 9)
 */

export interface IncidentSummary {
  open_incidents: number;
  critical_incidents: number;
  investigating_count: number;
  contained_count: number;
  resolved_count: number;
  avg_response_time_minutes: number;
  mttd_minutes: number;
  mtta_minutes: number;
  mttc_minutes: number;
  mttr_minutes: number;
  total_financial_exposure: number;
}

export interface IncidentItem {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  status: "DETECTED" | "TRIAGED" | "INVESTIGATING" | "CONTAINED" | "ERADICATED" | "RECOVERED" | "CLOSED" | string;
  owner?: string;
  created_at: string;
  updated_at: string;
  affected_assets_count: number;
  business_service_name?: string;
  financial_exposure: number;
  threat_actor?: string;
  mitre_technique?: string;
}

export interface IncidentDetail extends IncidentItem {
  affected_assets: Array<{
    asset_id: string;
    name: string;
    ip?: string;
    criticality?: string;
    exposure?: number;
  }>;
  affected_business_services: Array<{
    service_id: string;
    name: string;
    criticality?: string;
    revenue_dependency?: string;
  }>;
  related_alerts: Array<{
    alert_id: string;
    title: string;
    severity: string;
  }>;
  related_events: Array<{
    event_id: string;
    type: string;
    source: string;
    timestamp: string;
  }>;
  related_iocs: Array<{
    indicator: string;
    type: string;
    confidence: string;
  }>;
  attack_paths: Array<{
    path_id: string;
    name: string;
    risk_score: number;
    financial_exposure: number;
  }>;
  potential_loss: number;
  expected_annual_loss: number;
  downtime_exposure: number;
  recovery_cost: number;
  timeline: Array<{
    timestamp: string;
    action: string;
    actor: string;
    description: string;
  }>;
  evidence_items: Array<{
    id: string;
    title: string;
    evidence_type: string;
    file_name: string;
    file_size_bytes: number;
    uploaded_by: string;
    uploaded_at: string;
    verification_status: string;
  }>;
  tasks: Array<{
    id: string;
    task: string;
    owner: string;
    priority: string;
    status: string;
    due_date?: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    comment: string;
    timestamp: string;
  }>;
  response_actions: Array<{
    action_type: string;
    target: string;
    status: string;
    executed_by?: string;
    timestamp?: string;
  }>;
}
