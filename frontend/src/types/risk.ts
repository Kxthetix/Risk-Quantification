export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | "CRITICAL";

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskOverview {
  overall_score: number;
  risk_level: RiskLevel;
  distribution: RiskDistribution;
  total_assets_assessed: number;
  total_vulnerabilities_scored: number;
  last_calculated_at?: string;
}

export interface RiskTrendPoint {
  date: string;
  score: number;
  risk_level: RiskLevel;
}

export interface RiskTrendResponse {
  period: string;
  trend_direction: "IMPROVING" | "WORSENING" | "STABLE";
  points: RiskTrendPoint[];
}
