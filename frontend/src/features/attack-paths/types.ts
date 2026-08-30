import { RiskLevel } from "@/types/risk";

export type AttackPathStatus = "ACTIVE" | "MITIGATED" | "BLOCKED" | "ACCEPTED" | "INVESTIGATING";
export type NodeKind =
  | "INTERNET"
  | "ENTRY_POINT"
  | "ASSET"
  | "APPLICATION"
  | "DATABASE"
  | "IDENTITY"
  | "USER"
  | "BUSINESS_SERVICE"
  | "VULNERABILITY"
  | "CREDENTIAL"
  | "CLOUD_RESOURCE"
  | "SECURITY_CONTROL";

export type EdgeKind =
  | "NETWORK_REACHABILITY"
  | "EXPLOITATION"
  | "CREDENTIAL_ABUSE"
  | "LATERAL_MOVEMENT"
  | "PRIVILEGE_ESCALATION"
  | "DATA_ACCESS"
  | "AUTHENTICATES_TO"
  | "DEPENDS_ON"
  | "CONTAINS"
  | "EXPOSES";

export interface MitreTechnique {
  id?: string;
  technique_id: string;
  name: string;
  tactic: string;
  description?: string | null;
  source?: string;
  attack_paths_count?: number;
  affected_assets_count?: number;
  risk_level?: RiskLevel;
  financial_exposure?: number;
}

export interface AttackPathNode {
  id: string;
  node_type: string;
  asset_id?: string | null;
  vulnerability_id?: string | null;
  technique_id?: string | null;
  technique?: MitreTechnique | null;
  label?: string | null;
  sequence: number;
  score: number;
  node_metadata?: Record<string, any> | null;
}

export interface AttackPathEdge {
  id: string;
  source_node_id: string;
  destination_node_id: string;
  edge_type: string;
  probability: number;
  confidence: number;
  is_blocked: boolean;
  blocking_reason?: string | null;
  evidence?: Record<string, any> | null;
}

export interface AttackPath {
  id: string;
  path_id?: string;
  source_node: string;
  target_node: string;
  target_asset_id?: string | null;
  target_asset_name?: string | null;
  business_service_name?: string | null;
  path_score: number;
  likelihood: number;
  impact: number;
  confidence: number;
  path_length: number;
  status: AttackPathStatus;
  is_blocked: boolean;
  blocking_control?: string | null;
  nodes: AttackPathNode[];
  edges: AttackPathEdge[];
  financial_exposure: number;
  created_at: string;
}

export interface AttackPathListResponse {
  paths: AttackPath[];
  total_paths: number;
  critical_paths_count: number;
  blocked_paths_count: number;
}

export interface AttackPathSummary {
  total_paths: number;
  critical_paths_count: number;
  high_risk_paths_count: number;
  exposed_entry_points_count: number;
  critical_assets_exposed_count: number;
  mitre_techniques_count: number;
  business_services_exposed_count: number;
  total_financial_exposure: number;
  highest_risk_score: number;
  average_risk_score: number;
}

export interface GraphVisualNode {
  id: string;
  label: string;
  type: string;
  asset_id?: string | null;
  vulnerability_id?: string | null;
  criticality?: string | null;
  risk_score: number;
  is_entry_point: boolean;
  metadata?: Record<string, any> | null;
}

export interface GraphVisualEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  probability: number;
  confidence: number;
  is_blocked: boolean;
  blocking_reason?: string | null;
}

export interface AttackGraphData {
  nodes: GraphVisualNode[];
  edges: GraphVisualEdge[];
}

export interface ChokepointItem {
  asset_id?: string | null;
  node_id: string;
  node_label: string;
  node_type: string;
  affected_paths: number;
  critical_paths: number;
  risk_reduction_potential: number;
}

export interface EntryPointItem {
  id: string;
  name: string;
  exposure_type: string;
  asset_id?: string | null;
  asset_name?: string | null;
  vulnerabilities_count: number;
  attack_paths_count: number;
  risk_score: number;
  financial_exposure: number;
  criticality: string;
}

export interface CrownJewelItem {
  asset_id: string;
  asset_name: string;
  asset_type: string;
  criticality: string;
  business_service?: string | null;
  business_value: number;
  financial_exposure: number;
  attack_paths_count: number;
  shortest_path_length: number;
  highest_risk_score: number;
}

export type AttackerProfile = "EXTERNAL_ATTACKER" | "INSIDER_THREAT" | "COMPROMISED_PARTNER" | "RANSOMWARE_ACTOR" | "NATION_STATE";

export interface ThreatScenario {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  attacker_profile: AttackerProfile;
  objective?: string | null;
  entry_point?: string | null;
  target_asset_id?: string | null;
  target_asset_name?: string | null;
  probability: number;
  confidence: number;
  risk_score: number;
  financial_assessment_id?: string | null;
  financial_exposure?: Record<string, any> | null;
  status: string;
  scenario_metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ThreatScenarioCompareItem {
  scenario_id: string;
  name: string;
  attacker_profile: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  expected_loss: number;
  p90_loss: number;
  target_criticality?: string | null;
  confidence: number;
  path_length: number;
}

export interface ThreatScenarioCompareResponse {
  scenarios: ThreatScenarioCompareItem[];
  highest_risk_scenario_id?: string | null;
  highest_loss_scenario_id?: string | null;
}

export interface AnalysisJob {
  job_id: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  simulations_completed: number;
  total_simulations: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface AttackPathFilterParams {
  [key: string]: string | number | boolean | null | undefined;
  risk_level?: string;
  target_asset_id?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MitigationItem {
  id: string;
  title: string;
  description: string;
  control_type: string;
  blocked_paths_count: number;
  risk_reduction_pct: number;
  financial_reduction: number;
  owner?: string;
  due_date?: string;
  status: "Open" | "In Progress" | "Completed" | "Accepted" | "Rejected";
}
