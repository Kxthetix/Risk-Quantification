import { useMutation, useQuery } from "@tanstack/react-query";
import { optimizationApi } from "./api";
import { OptimizationRunInput, WhatIfOptimizationInput } from "./types";

export const OPTIMIZATION_QUERY_KEY = ["optimization"] as const;

export function useRunOptimization() {
  return useMutation({
    mutationFn: (payload: OptimizationRunInput) => optimizationApi.runOptimization(payload),
  });
}

export function useStrategicAlternatives(budget: number, enabled: boolean = true) {
  return useQuery({
    queryKey: [...OPTIMIZATION_QUERY_KEY, "alternatives", budget],
    queryFn: () => optimizationApi.getAlternatives(budget),
    enabled: enabled && budget > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBudgetCurve(maxBudget?: number, steps?: number) {
  return useQuery({
    queryKey: [...OPTIMIZATION_QUERY_KEY, "budget-curve", maxBudget, steps],
    queryFn: () => optimizationApi.getBudgetCurve(maxBudget, steps),
    staleTime: 1000 * 60 * 5,
  });
}

export function useWhatIfOptimization() {
  return useMutation({
    mutationFn: (payload: WhatIfOptimizationInput) => optimizationApi.runWhatIf(payload),
  });
}

export function useExecutiveInvestmentSummary() {
  return useQuery({
    queryKey: [...OPTIMIZATION_QUERY_KEY, "executive-summary"],
    queryFn: () => optimizationApi.getExecutiveSummary(),
    staleTime: 1000 * 60 * 5,
  });
}
