export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertType =
  | "CRITICAL_RISK_INCREASE"
  | "NEW_CRITICAL_ATTACK_PATH"
  | "FINANCIAL_RISK_INCREASE"
  | "SLA_BREACH"
  | "CONTROL_COVERAGE_DROP"
  | "RISK_ACCEPTANCE_EXPIRING"
  | "NEW_CRITICAL_VULNERABILITY"
  | "RISK_REGRESSION";

export interface Alert {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  alert_type: AlertType;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}
