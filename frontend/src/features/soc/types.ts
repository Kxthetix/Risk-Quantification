/**
 * SOC TypeScript Types (Phase 10)
 */

export interface SOCDashboard {
  critical_alerts: number;
  open_incidents: number;
  incidents_investigating: number;
  assets_under_attack: number;
  active_playbooks: number;
  pending_approvals: number;
  failed_actions: number;
  financial_exposure: number;
  recent_timeline: Array<{
    timestamp: string;
    actor: string;
    action: string;
    source: string;
    description: string;
  }>;
  active_incidents: Array<{
    id: string;
    incident_number: string;
    title: string;
    severity: string;
    status: string;
    owner: string;
    business_service: string;
    financial_exposure: number;
    created_at: string;
  }>;
  assets_under_response: Array<{
    asset_id: string;
    name: string;
    ip: string;
    criticality: string;
    status: string;
    action_in_progress: string;
  }>;
  response_activity: Array<{
    action: string;
    target: string;
    status: string;
    executed_at: string;
  }>;
}

export interface SOCMetrics {
  mttd_minutes: number;
  mtta_minutes: number;
  mttc_minutes: number;
  mttr_minutes: number;
  incident_volume_30d: number;
  critical_incident_rate_pct: number;
  false_positive_rate_pct: number;
  playbook_success_rate_pct: number;
  automation_rate_pct: number;
  sla_compliance_pct: number;
  auto_contained_count: number;
  manually_contained_count: number;
  failed_actions_count: number;
}

export interface IncidentTriageResult {
  incident_id: string;
  decision: string;
  status: string;
  severity: string;
  analyst: string;
  timestamp: string;
  audit_id: string;
  next_step: string;
}

export interface IncidentNote {
  id: string;
  note_type: "FINDING" | "HYPOTHESIS" | "OBSERVATION" | "RECOMMENDATION" | string;
  content: string;
  author: string;
  created_at: string;
}

export interface IncidentRelationshipNode {
  id: string;
  label: string;
  node_type: string;
  severity?: string;
  metadata?: Record<string, any>;
}

export interface IncidentRelationshipEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface IncidentRelationshipGraphData {
  incident_id: string;
  nodes: IncidentRelationshipNode[];
  edges: IncidentRelationshipEdge[];
}

export interface SOCTrendPoint {
  date: string;
  incident_count: number;
  critical_count: number;
  resolved_count: number;
  avg_resolution_time_min: number;
  potential_loss: number;
  actual_loss: number;
  risk_reduced: number;
}

export interface SOCTrendData {
  period: string;
  trends: SOCTrendPoint[];
}

export interface SOCHitMapItem {
  asset_criticality: string;
  incident_severity: string;
  business_impact: string;
  incident_count: number;
  financial_exposure: number;
  risk_score: number;
}

export interface SOCTask {
  id: string;
  incident_id: string;
  incident_number: string;
  task: string;
  owner: string;
  priority: string;
  status: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED" | string;
  due_date?: string;
  created_at: string;
  sla_status: "ON_TRACK" | "AT_RISK" | "BREACHED" | string;
}
