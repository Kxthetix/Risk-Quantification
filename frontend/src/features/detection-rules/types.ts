/**
 * Detection Rules TypeScript Types (Phase 9)
 */

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL" | string;
  source: "SIEM" | "EDR" | "WAF" | "NETWORK" | "CLOUD" | string;
  mitre_technique: string;
  mitre_tactic: string;
  status: "ENABLED" | "DISABLED" | "TESTING" | string;
  matches_count: number;
  last_triggered?: string;
  created_at: string;
  updated_at: string;
}

export interface DetectionRuleDetail extends DetectionRule {
  detection_logic: string;
  data_sources: string[];
  false_positive_rate_pct: number;
  triggered_alerts: Array<{
    alert_id: string;
    title: string;
    timestamp: string;
  }>;
}

export interface DetectionRuleTestResult {
  matched: boolean;
  execution_time_ms: number;
  matched_conditions: string[];
  extracted_fields: Record<string, any>;
  rule_status: string;
  error_message?: string;
}
