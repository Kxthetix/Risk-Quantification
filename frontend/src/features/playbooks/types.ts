/**
 * SOAR Playbooks TypeScript Types (Phase 10)
 */

export interface PlaybookStep {
  step_id: string;
  step_number: number;
  name: string;
  action_type: string;
  target_type: "ASSET" | "IP" | "DOMAIN" | "USER" | "SYSTEM" | string;
  default_target?: string;
  requires_approval: boolean;
  is_high_risk: boolean;
  condition?: string;
  timeout_seconds: number;
  rollback_action?: string;
}

export interface PlaybookItem {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: "AUTOMATIC" | "MANUAL" | "SCHEDULED" | string;
  status: "ENABLED" | "DISABLED" | "DRAFT" | string;
  execution_count: number;
  success_rate_pct: number;
  avg_duration_seconds: number;
  steps_count: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybookDetail extends PlaybookItem {
  steps: PlaybookStep[];
  required_permissions: string[];
  approval_requirements?: string;
  configured_integrations: string[];
  estimated_risk_reduction_pct: number;
}

export interface PlaybookExecutionStepTrace {
  step_id: string;
  step_number: number;
  name: string;
  action_type: string;
  target: string;
  status: "QUEUED" | "RUNNING" | "WAITING_FOR_APPROVAL" | "SUCCEEDED" | "FAILED" | "SKIPPED" | "ROLLED_BACK" | string;
  requires_approval: boolean;
  is_high_risk: boolean;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  result?: string;
  error_message?: string;
}

export interface PlaybookExecution {
  execution_id: string;
  playbook_id: string;
  playbook_name: string;
  incident_id?: string;
  status: "QUEUED" | "RUNNING" | "WAITING_FOR_APPROVAL" | "PAUSED" | "SUCCEEDED" | "PARTIALLY_SUCCEEDED" | "FAILED" | "CANCELLED" | string;
  dry_run: boolean;
  started_by: string;
  started_at: string;
  completed_at?: string;
  steps_executed: number;
  total_steps: number;
  current_step_name?: string;
  steps: PlaybookExecutionStepTrace[];
  risk_before_score: number;
  risk_after_score?: number;
  financial_exposure_reduced: number;
}
