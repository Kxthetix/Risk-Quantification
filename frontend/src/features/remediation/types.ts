import { z } from "zod";
import {
  remediationCreateSchema,
  remediationUpdateSchema,
  remediationVerifySchema,
  riskAcceptanceSchema,
} from "./schemas";

export type RemediationType =
  | "PATCH"
  | "UPGRADE"
  | "CONFIGURATION_CHANGE"
  | "NETWORK_SEGMENTATION"
  | "ACCESS_CONTROL"
  | "MFA"
  | "WAF_RULE"
  | "FIREWALL_RULE"
  | "VIRTUAL_PATCH"
  | "COMPENSATING_CONTROL"
  | "ASSET_RETIREMENT";

export type RemediationStatus =
  | "OPEN"
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "ACCEPTED_RISK"
  | "REJECTED";

export type RemediationPriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RemediationCostDetails {
  minimum_cost: number;
  most_likely_cost: number;
  maximum_cost: number;
  labor_cost: number;
  technology_cost: number;
  one_time_cost: number;
  recurring_annual_cost: number;
  confidence: number;
}

export interface Remediation {
  id: string;
  organization_id: string;
  asset_vulnerability_id?: string | null;
  title: string;
  description?: string | null;
  remediation_type: RemediationType;
  status: RemediationStatus;
  priority_score: number; // 0 - 100
  priority_level: RemediationPriorityLevel;
  estimated_cost: number;
  estimated_duration_hours?: number | null;
  due_date?: string | null;
  assigned_to?: string | null;
  risk_reduction_score?: number | null;
  expected_loss_reduction?: number | null;
  rosi_percentage?: number | null;
  created_at: string;
  updated_at: string;
  cve_id?: string | null;
  asset_name?: string | null;
  cost_details?: RemediationCostDetails | null;
}

export interface TopRemediationItem {
  id: string;
  asset_vulnerability_id: string;
  title: string;
  remediation_type: RemediationType;
  priority_score: number;
  priority_level: RemediationPriorityLevel;
  cve_id?: string | null;
  asset_name?: string | null;
  current_risk_score: number;
  expected_loss_reduction: number;
  estimated_cost: number;
  rosi_percentage: number;
  breaks_attack_path: boolean;
}

export interface TopRemediationsResponse {
  items: TopRemediationItem[];
  total_projected_loss_reduction: number;
  total_estimated_cost: number;
  average_rosi: number;
}

export interface RemediationSimulateResponse {
  remediation_id: string;
  title: string;
  current_risk: number;
  residual_risk: number;
  risk_reduction: number;
  baseline_expected_loss: number;
  residual_expected_loss: number;
  expected_loss_reduction: number;
  implementation_cost: number;
  tco_3year: number;
  roi: number;
  breaks_attack_paths_count: number;
}

export type RemediationCreateInput = z.infer<typeof remediationCreateSchema>;
export type RemediationUpdateInput = z.infer<typeof remediationUpdateSchema>;
export type RemediationVerifyInput = z.infer<typeof remediationVerifySchema>;
export type RiskAcceptanceInput = z.infer<typeof riskAcceptanceSchema>;
