import { RiskLevel } from "./risk";

export interface ExecutiveKPIs {
  overall_risk_score: number;
  risk_level: RiskLevel;
  total_assets: number;
  critical_vulnerabilities: number;
  active_attack_paths: number;
  expected_annual_loss: number;
  risk_trend_direction: "IMPROVING" | "WORSENING" | "STABLE";
  financial_trend_direction: "IMPROVING" | "WORSENING" | "STABLE";
  security_score: number;
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveKPIs;
  period: string;
  generated_at: string;
  data_as_of: string;
}
