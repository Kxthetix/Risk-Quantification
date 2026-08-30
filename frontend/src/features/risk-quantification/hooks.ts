import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { riskQuantificationApi } from "./api";
import {
  ScenarioCreatePayload,
  WhatIfPayload,
  ControlRoiPayload,
} from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const RISK_QUANTIFICATION_KEYS = {
  all: ["risk-quantification"] as const,
  summary: ["risk-quantification", "summary"] as const,
  topLosses: (limit?: number) => ["risk-quantification", "top-losses", limit] as const,
  profile: ["risk-quantification", "profile"] as const,
  assessment: (id: string) => ["risk-quantification", "assessment", id] as const,
  breakdown: (id: string) => ["risk-quantification", "breakdown", id] as const,
  distribution: (id: string) => ["risk-quantification", "distribution", id] as const,
  simulationStatus: (jobId: string) => ["risk-quantification", "simulation", jobId] as const,
  scenarios: (status?: string) => ["threat-scenarios", status] as const,
  scenario: (id: string) => ["threat-scenarios", "detail", id] as const,
};

export function useOrganizationFinancialSummary() {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.summary,
    queryFn: () => riskQuantificationApi.getSummary(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useTopLosses(limit: number = 10) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.topLosses(limit),
    queryFn: () => riskQuantificationApi.getTopLosses(limit),
    staleTime: 1000 * 60 * 3,
  });
}

export function useFinancialProfile() {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.profile,
    queryFn: () => riskQuantificationApi.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateFinancialProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: any) => riskQuantificationApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RISK_QUANTIFICATION_KEYS.all });
      toast({
        title: "Financial Profile Saved",
        description: "Updated baseline revenue and cost parameters.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useFinancialAssessment(assessmentId: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.assessment(assessmentId),
    queryFn: () => riskQuantificationApi.getAssessment(assessmentId),
    enabled: !!assessmentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLossBreakdown(assessmentId: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.breakdown(assessmentId),
    queryFn: () => riskQuantificationApi.getBreakdown(assessmentId),
    enabled: !!assessmentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLossDistribution(assessmentId: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.distribution(assessmentId),
    queryFn: () => riskQuantificationApi.getDistribution(assessmentId),
    enabled: !!assessmentId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSimulationStatus(jobId?: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.simulationStatus(jobId || ""),
    queryFn: () => riskQuantificationApi.getSimulationStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "COMPLETED" || status === "FAILED" || status === "CANCELLED"
        ? false
        : 2000;
    },
  });
}

export function useCalculateFinancialLoss() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      asset_vulnerability_id: string;
      simulation_count?: number;
      random_seed?: number;
      synchronous?: boolean;
      overrides?: Record<string, any>;
    }) => riskQuantificationApi.calculate(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: RISK_QUANTIFICATION_KEYS.all });
      toast({
        title: "Simulation Job Dispatched",
        description: `Monte Carlo run initialized with Job ID: ${res.job_id}`,
        variant: "info",
      });
    },
    onError: (error) => {
      toast({
        title: "Simulation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useThreatScenarios(status?: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.scenarios(status),
    queryFn: () => riskQuantificationApi.getThreatScenarios(status),
    staleTime: 1000 * 60 * 3,
  });
}

export function useThreatScenario(id: string) {
  return useQuery({
    queryKey: RISK_QUANTIFICATION_KEYS.scenario(id),
    queryFn: () => riskQuantificationApi.getThreatScenario(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateThreatScenario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ScenarioCreatePayload) =>
      riskQuantificationApi.createThreatScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat-scenarios"] });
      queryClient.invalidateQueries({ queryKey: RISK_QUANTIFICATION_KEYS.all });
      toast({
        title: "Risk Scenario Created",
        description: "Registered threat scenario and quantified loss magnitude.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Scenario Creation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useGenerateThreatScenarios() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (targetAssetId?: string) =>
      riskQuantificationApi.generateThreatScenarios(targetAssetId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["threat-scenarios"] });
      toast({
        title: "Baseline Scenarios Generated",
        description: `Synthesized ${res.length} standardized attack scenarios.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useWhatIfAnalysis() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: WhatIfPayload) => riskQuantificationApi.runWhatIf(payload),
    onError: (error) => {
      toast({
        title: "What-If Calculation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useControlScenarioROI() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: ControlRoiPayload) =>
      riskQuantificationApi.runControlScenario(payload),
    onError: (error) => {
      toast({
        title: "ROI Calculation Failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
