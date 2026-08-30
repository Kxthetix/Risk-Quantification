import { RiskLevel } from "@/types/risk";
import { CurrencyCode } from "@/types/common";

export type TrendDirection = "IMPROVING" | "WORSENING" | "STABLE" | "UP" | "DOWN";

export interface DashboardMeta {
  generated_at: string;
  data_as_of: string;
  model_version?: string;
  confidence?: number;
}

export interface ExecutiveDashboard {
  overall_risk_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expected_annual_loss: number;
  p50_loss: number;
  p90_loss: number;
  p95_loss?: number;
  critical_assets: number;
  critical_vulnerabilities: number;
  critical_attack_paths: number;
  open_remediations: number;
  overdue_remediations: number;
  risk_reduction_potential: number;
  security_investment: number;
  modeled_risk_reduction: number;
  risk_trend: TrendDirection;
  previous_score?: number;
  score_change?: number;
  meta: DashboardMeta;
}

export interface ExecutiveKPIs {
  overall_risk_score: number;
  expected_annual_loss: number;
  critical_findings: number;
  critical_attack_paths: number;
  open_remediations: number;
  overdue_remediations: number;
  risk_reduction_potential: number;
  security_investment: number;
  roi: number;
  meta: DashboardMeta;
}

export interface RiskDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RiskOverview {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  distribution: RiskDistribution;
  assessed_count: number;
  meta: DashboardMeta;
}

export interface TimeSeriesPoint {
  date: string;
  risk_score: number;
}

export interface RiskTrendResponse {
  points: TimeSeriesPoint[];
  trend_direction: TrendDirection;
  percentage_change: number;
  absolute_change: number;
  meta: DashboardMeta;
}

export interface FinancialTrendPoint {
  date: string;
  expected_loss: number;
  p50_loss: number;
  p90_loss: number;
  p95_loss: number;
}

export interface FinancialTrendResponse {
  points: FinancialTrendPoint[];
  trend_direction: TrendDirection;
  percentage_change: number;
  meta: DashboardMeta;
}

export interface FinancialRiskResponse {
  expected_annual_loss: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  maximum_modeled_loss: number;
  currency: string;
  meta: DashboardMeta;
}

export interface FinancialServiceRisk {
  service_id: string;
  service: string;
  criticality: string;
  expected_loss: number;
  p90_loss: number;
}

export interface FinancialAssetRisk {
  asset_id: string;
  asset: string;
  business_service?: string;
  criticality: string;
  risk_score: number;
  expected_loss: number;
  p90_loss: number;
}

export interface TopCyberRiskFinding {
  finding_id: string;
  asset: string;
  cve_id?: string;
  risk_score: number;
  expected_loss: number;
  attack_paths: number;
  known_exploited: boolean;
  priority: string;
}

export interface TopAttackPathItem {
  path_id: string;
  entry_point: string;
  target: string;
  target_asset_name?: string;
  path_length: number;
  likelihood: number;
  impact: number;
  path_score: number;
  financial_exposure: number;
}

export interface AttackSurfaceResponse {
  total_assets: number;
  internet_facing: number;
  critical_assets: number;
  known_exploited_assets: number;
  assets_with_critical_vulns: number;
  meta: DashboardMeta;
}

export interface VulnerabilityOverviewResponse {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  known_exploited: number;
  unvalidated: number;
  validated: number;
  overdue: number;
  new_in_period: number;
  resolved_in_period: number;
  meta: DashboardMeta;
}

export interface RemediationDashboardResponse {
  open: number;
  planned: number;
  in_progress: number;
  completed: number;
  verified: number;
  accepted_risk: number;
  overdue: number;
  total_expected_loss_reduction: number;
  total_remediation_cost: number;
  average_remediation_time_hours: number;
  meta: DashboardMeta;
}

export interface InvestmentDashboardResponse {
  total_security_investment: number;
  one_time_cost: number;
  recurring_cost: number;
  expected_loss_reduction: number;
  modeled_risk_reduction: number;
  roi: number;
  risk_reduction_per_rupee: number;
  meta: DashboardMeta;
}

export interface HeatmapCell {
  likelihood: number;
  impact: number;
  finding_count: number;
  asset_count: number;
  financial_exposure: number;
}

export interface RiskHeatmapResponse {
  dimensions: Record<string, number>;
  cells: HeatmapCell[];
  meta: DashboardMeta;
}

export interface BusinessServiceRisk {
  service_name: string;
  risk_score: number;
  expected_loss: number;
  critical_assets: number;
  open_remediations: number;
  vulnerability_count?: number;
}

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  description: string;
  risk_reduction_points: number;
  financial_loss_avoided: number;
  estimated_effort: "LOW" | "MEDIUM" | "HIGH";
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
  category: "PATCH" | "SEGMENTATION" | "CREDENTIAL" | "WAF" | "EDR";
}

export interface DashboardFilters {
  period?: "7d" | "30d" | "90d" | "1y";
  environment?: string;
  businessUnit?: string;
  riskLevel?: string;
}
