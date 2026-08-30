/**
 * Case Management TypeScript Types (Phase 10)
 */

export interface CaseItem {
  id: string;
  case_number: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
  status: "OPEN" | "IN_PROGRESS" | "PENDING_REVIEW" | "CLOSED" | string;
  lead_investigator: string;
  incident_ids: string[];
  tags: string[];
  total_financial_exposure: number;
  created_at: string;
  updated_at: string;
}

export interface CaseDetail extends CaseItem {
  description: string;
  hypothesis?: string;
  incident_count: number;
  playbook_executions: string[];
  evidence_count: number;
  tasks_count: number;
  resolved_at?: string;
}
