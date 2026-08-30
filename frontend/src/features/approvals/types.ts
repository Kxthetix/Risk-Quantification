/**
 * SOAR Approvals TypeScript Types (Phase 10)
 */

export interface ApprovalItem {
  id: string;
  incident_id?: string;
  incident_number?: string;
  playbook_id?: string;
  playbook_name?: string;
  execution_id?: string;
  action_type: string;
  target: string;
  reason: string;
  requested_by: string;
  potential_impact: string;
  current_risk_exposure: number;
  projected_risk_exposure: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | string;
  created_at: string;
  expires_at: string;
  decision_by?: string;
  decision_at?: string;
  decision_notes?: string;
  is_high_risk: boolean;
}

export interface ApprovalDetail extends ApprovalItem {
  target_details: Record<string, any>;
  affected_services: string[];
  affected_assets: string[];
}
