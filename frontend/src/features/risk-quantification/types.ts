import {
  FinancialProfile,
  FinancialAssessment,
  FinancialDistribution,
  LossBreakdown,
  TopLossFinding,
  OrganizationFinancialSummary,
  SimulationJob,
  WhatIfResponse,
  ControlScenarioResponse,
  SimulationStatus,
} from "@/types/financial";
import { AssetCriticality } from "@/types/asset";

export type ThreatScenarioCategory =
  | "RANSOMWARE"
  | "DATA_BREACH"
  | "BUSINESS_INTERRUPTION"
  | "CLOUD_OUTAGE"
  | "INSIDER_THREAT"
  | "SUPPLY_CHAIN"
  | "CREDENTIAL_THEFT"
  | "DDOS"
  | "FRAUD"
  | "THIRD_PARTY";

export type ScenarioStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface ThreatScenarioItem {
  id: string;
  name: string;
  description?: string;
  category: ThreatScenarioCategory;
  business_service?: string;
  business_service_id?: string;
  risk_owner?: string;
  status: ScenarioStatus;
  annual_rate_of_occurrence: number; // ARO
  single_loss_expectancy: number; // SLE
  expected_annual_loss: number; // EAL
  p95_loss: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affected_assets_count: number;
  affected_asset_ids: string[];
  last_simulated_at?: string;
  created_at: string;
}

export interface ScenarioCreatePayload {
  name: string;
  description?: string;
  category: ThreatScenarioCategory;
  business_service_id?: string;
  risk_owner?: string;
  status: ScenarioStatus;
  affected_asset_ids: string[];
  // Frequency
  frequency_method: "ARO" | "HISTORICAL" | "EXPERT";
  annual_rate_of_occurrence: number;
  frequency_min?: number;
  frequency_mode?: number;
  frequency_max?: number;
  // Loss magnitude
  expected_downtime_hours: number;
  hourly_downtime_cost?: number;
  expected_revenue_loss?: number;
  recovery_cost: number;
  data_breach_records?: number;
  cost_per_record?: number;
  potential_regulatory_fine?: number;
  legal_and_consulting_cost?: number;
  customer_compensation?: number;
  third_party_penalty?: number;
  insurance_recovery_limit?: number;
  insurance_deductible?: number;
  // Simulation
  simulation_count: number;
  random_seed?: number;
}

export interface SensitivityTornadoItem {
  variable_name: string;
  variable_key: string;
  baseline_value: number;
  low_impact_eal: number;
  high_impact_eal: number;
  swing_amount: number;
  unit: string;
}

export interface RiskAppetiteSettings {
  max_expected_annual_loss: number;
  max_single_loss: number;
  max_p95_loss: number;
  max_service_exposure: number;
  current_eal: number;
  is_breached: boolean;
  breach_excess: number;
  currency: string;
}

export interface FinancialAssumptionItem {
  id: string;
  key: string;
  name: string;
  value: number;
  unit: string;
  data_source: "INTERNAL_DATA" | "HISTORICAL_INCIDENT" | "INDUSTRY_BENCHMARK" | "EXPERT_ESTIMATE";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  updated_at: string;
  owner: string;
  history: Array<{
    previous_value: number;
    new_value: number;
    changed_by: string;
    changed_at: string;
    reason?: string;
  }>;
}

export interface WhatIfPayload {
  asset_vulnerability_id?: string;
  scenario_id?: string;
  downtime_hours?: number;
  recovery_hours?: number;
  dependency_factor?: number;
  data_exposure_probability?: number;
  incident_probability?: number;
}

export interface ControlRoiPayload {
  asset_vulnerability_id?: string;
  control_name: string;
  implementation_cost: number;
  risk_reduction_percentage: number; // e.g. 0.35 for 35%
}
