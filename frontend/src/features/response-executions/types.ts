/**
 * Response Executions TypeScript Types (Phase 10)
 */

export interface ExecutionStepTrace {
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

export interface ResponseExecution {
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
  steps: ExecutionStepTrace[];
  risk_before_score: number;
  risk_after_score?: number;
  financial_exposure_reduced: number;
}
