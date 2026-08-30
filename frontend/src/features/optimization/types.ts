import { z } from "zod";
import {
  optimizationRunSchema,
  whatIfOptimizationSchema,
} from "./schemas";

export type OptimizationAlgorithm = "KNAPSACK" | "GREEDY";

export interface SelectedAction {
  action_type: "REMEDIATION" | "CONTROL";
  action_id: string;
  title: string;
  cost: number;
  expected_loss_reduction: number;
  rosi_percentage: number;
  priority_level?: string;
  breaks_attack_path?: boolean;
}

export interface OptimizationResult {
  id: string;
  organization_id: string;
  scenario_id?: string | null;
  budget: number;
  total_cost: number;
  expected_loss_reduction: number;
  residual_loss: number;
  baseline_loss: number;
  portfolio_rosi: number;
  residual_risk_score: number;
  baseline_risk_score: number;
  algorithm: OptimizationAlgorithm;
  selected_actions: SelectedAction[];
  unselected_actions: SelectedAction[];
  created_at: string;
}

export interface StrategicAlternative {
  name: string;
  code: "MAX_RISK_REDUCTION" | "HIGHEST_ROSI" | "BALANCED" | "FAST_WINS";
  description: string;
  total_cost: number;
  expected_loss_reduction: number;
  portfolio_rosi: number;
  residual_risk_score: number;
  action_count: number;
  recommended: boolean;
  selected_actions: SelectedAction[];
}

export interface AlternativesResponse {
  budget: number;
  alternatives: StrategicAlternative[];
}

export interface BudgetCurvePoint {
  budget: number;
  budget_percentage: number;
  selected_cost: number;
  expected_loss_reduction: number;
  portfolio_rosi: number;
  residual_risk_score: number;
  action_count: number;
  marginal_loss_reduction: number;
  is_inflection_point?: boolean;
}

export interface BudgetCurveResponse {
  points: BudgetCurvePoint[];
  optimal_budget_inflection: number;
  max_practical_budget: number;
  total_addressable_loss: number;
}

export interface WhatIfOptimizationResponse {
  total_cost: number;
  expected_loss_reduction: number;
  portfolio_rosi: number;
  baseline_risk_score: number;
  residual_risk_score: number;
  baseline_expected_loss: number;
  residual_expected_loss: number;
  selected_remediations_count: number;
  selected_controls_count: number;
  tco_3year: number;
}

export interface ExecutiveInvestmentOutputResponse {
  executive_headline: string;
  current_annual_loss_exposure: number;
  recommended_budget: number;
  projected_loss_reduction: number;
  residual_annual_loss_exposure: number;
  portfolio_rosi_percentage: number;
  target_risk_score: number;
  current_risk_score: number;
  action_priority: {
    immediate_chokepoint_fixes: number;
    strategic_control_investments: number;
    quick_wins: number;
  };
  strategic_recommendation: string;
}

export type OptimizationRunInput = z.infer<typeof optimizationRunSchema>;
export type WhatIfOptimizationInput = z.infer<typeof whatIfOptimizationSchema>;
