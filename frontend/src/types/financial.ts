import { AssetCriticality } from "./asset";

export type FinancialScenarioType = "BEST_CASE" | "BASE_CASE" | "WORST_CASE";
export type SimulationStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface FinancialProfile {
  id: string;
  organization_id: string;
  currency: string;
  annual_revenue: number;
  operating_days_per_year: number;
  hours_per_day: number;
  employee_count: number;
  average_hourly_employee_cost: number;
  incident_response_hourly_cost: number;
  security_team_size: number;
  backup_recovery_hourly_cost: number;
  customer_count: number;
  average_customer_value: number;
  cost_per_record: number;
  daily_revenue: number;
  hourly_revenue: number;
  average_hourly_revenue: number;
  average_hourly_profit: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialPercentiles {
  p10: number;
  p25?: number;
  p50: number;
  p75?: number;
  p90: number;
  p95: number;
  p99?: number;
  expected_loss: number;
  minimum_loss?: number;
  maximum_loss?: number;
  var_95?: number; // Value at Risk 95%
}

export interface FinancialFactorItem {
  factor_type: string;
  distribution_type: string;
  expected_value: number;
  contribution: number;
  minimum_value: number;
  most_likely_value: number;
  maximum_value: number;
  probability: number;
}

export interface FinancialAssessment {
  id: string;
  asset_id: string;
  currency: string;
  estimated_loss: number;
  expected_loss: number;
  annual_expected_loss: number;
  minimum_loss: number;
  maximum_loss: number;
  p10_loss: number;
  p25_loss: number;
  p50_loss: number;
  p75_loss: number;
  p90_loss: number;
  p95_loss: number;
  simulation_count: number;
  model_version: string;
  factors: FinancialFactorItem[];
  calculated_at: string;
}

export interface LossBreakdown {
  currency: string;
  expected_loss: number;
  downtime: number;
  revenue_loss: number;
  incident_response: number;
  forensics: number;
  recovery: number;
  productivity: number;
  data_breach: number;
  regulatory: number;
  customer_compensation: number;
  third_party: number;
  reputational: number;
  percentage_contributions: Record<string, number>;
}

export interface FinancialDistribution {
  bins: number[];
  frequencies: number[];
}

export interface TopLossFinding {
  asset_vulnerability_id: string;
  asset_name: string;
  cve_id: string;
  risk_score: number;
  expected_loss: number;
  p90_loss: number;
  annual_expected_loss: number;
  primary_loss_driver: string;
}

export interface OrganizationFinancialSummary {
  currency: string;
  total_expected_annual_loss: number;
  total_potential_loss: number;
  top_losses: TopLossFinding[];
  expected_downtime_cost: number;
  expected_recovery_cost: number;
  expected_data_impact: number;
  expected_regulatory_cost: number;
  assessed_vulnerabilities_count: number;
}

export interface SimulationJob {
  job_id: string;
  status: SimulationStatus;
  progress: number;
  simulations_completed: number;
  total_simulations: number;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
  model_version?: string;
}

export interface WhatIfResponse {
  currency: string;
  baseline_expected_loss: number;
  new_expected_loss: number;
  loss_reduction: number;
  percentage_reduction: number;
  parameters_modified: Record<string, any>;
}

export interface ControlScenarioResponse {
  control: string;
  currency: string;
  implementation_cost: number;
  baseline_expected_loss: number;
  new_expected_loss: number;
  risk_reduction_value: number;
  roi: number;
  label: string;
}

export interface FinancialRiskResponse {
  expected_annual_loss: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  maximum_modeled_loss: number;
  currency: string;
  meta?: {
    generated_at: string;
    data_as_of: string;
    model_version: string;
    confidence: number;
  };
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
  trend_direction: "IMPROVING" | "WORSENING" | "STABLE";
  percentage_change: number;
  meta?: {
    generated_at: string;
    data_as_of: string;
    model_version: string;
    confidence: number;
  };
}
