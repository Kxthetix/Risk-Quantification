import { apiClient } from "@/lib/api/client";
import {
  AlternativesResponse,
  BudgetCurveResponse,
  ExecutiveInvestmentOutputResponse,
  OptimizationResult,
  OptimizationRunInput,
  WhatIfOptimizationInput,
  WhatIfOptimizationResponse,
} from "./types";

export const optimizationApi = {
  runOptimization: async (payload: OptimizationRunInput): Promise<OptimizationResult> => {
    return apiClient.post<OptimizationResult>("/api/v1/optimization/run", payload);
  },

  getOptimizationResult: async (resultId: string): Promise<OptimizationResult> => {
    return apiClient.get<OptimizationResult>(`/api/v1/optimization/results/${resultId}`);
  },

  getAlternatives: async (budget: number): Promise<AlternativesResponse> => {
    return apiClient.get<AlternativesResponse>("/api/v1/optimization/alternatives", {
      params: { budget },
    });
  },

  getBudgetCurve: async (maxBudget?: number, steps?: number): Promise<BudgetCurveResponse> => {
    return apiClient.get<BudgetCurveResponse>("/api/v1/optimization/budget-curve", {
      params: { max_budget: maxBudget, steps },
    });
  },

  runWhatIf: async (payload: WhatIfOptimizationInput): Promise<WhatIfOptimizationResponse> => {
    return apiClient.post<WhatIfOptimizationResponse>("/api/v1/optimization/what-if", payload);
  },

  getExecutiveSummary: async (): Promise<ExecutiveInvestmentOutputResponse> => {
    return apiClient.get<ExecutiveInvestmentOutputResponse>("/api/v1/optimization/executive-summary");
  },
};
