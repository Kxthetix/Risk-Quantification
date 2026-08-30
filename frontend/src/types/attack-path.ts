export type AttackPathStatus = "POSSIBLE" | "HIGH_CONFIDENCE" | "BLOCKED";

export interface AttackPathNode {
  id: string;
  node_type: "ENTRY_POINT" | "ASSET" | "VULNERABILITY" | "IDENTITY" | "PRIVILEGE" | "BUSINESS_SERVICE" | "TARGET";
  label: string;
  asset_id?: string;
  vulnerability_id?: string;
  metadata?: Record<string, any>;
}

export interface AttackPathEdge {
  id: string;
  source_id: string;
  target_id: string;
  edge_type: "EXPLOITS" | "REACHES" | "AUTHENTICATES" | "LATERAL_MOVEMENT" | "ESCALATES" | "ACCESSES" | "DEPENDS_ON";
  description?: string;
}

export interface AttackPath {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: AttackPathStatus;
  risk_score: number;
  financial_impact?: number;
  entry_point: string;
  target_asset: string;
  nodes: AttackPathNode[];
  edges: AttackPathEdge[];
  created_at: string;
}
