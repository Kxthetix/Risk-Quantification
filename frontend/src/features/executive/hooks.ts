// Executive feature – React Query hooks (Phase 11)
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import * as api from "./api";
import type {
  RiskAcceptanceCreate,
  ScenarioCreate,
  ReportScheduleCreate,
} from "./types";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const executiveKeys = {
  all: ["executive"] as const,
  dashboard: () => [...executiveKeys.all, "dashboard"] as const,
  kpis: () => [...executiveKeys.all, "kpis"] as const,
  riskTrend: (days: number) => [...executiveKeys.all, "risk-trend", days] as const,
  riskDrivers: (days: number) => [...executiveKeys.all, "risk-drivers", days] as const,
  financialRisk: () => [...executiveKeys.all, "financial-risk"] as const,
  financialTrend: (days: number) => [...executiveKeys.all, "financial-trend", days] as const,
  lossDistribution: () => [...executiveKeys.all, "loss-distribution"] as const,
  businessServices: (sort: string) => [...executiveKeys.all, "business-services", sort] as const,
  assetRisk: (limit: number, sort: string) => [...executiveKeys.all, "asset-risk", limit, sort] as const,
  businessUnits: () => [...executiveKeys.all, "business-units"] as const,
  topRisks: (limit: number) => [...executiveKeys.all, "top-risks", limit] as const,
  attackPaths: () => [...executiveKeys.all, "attack-paths"] as const,
  vulnerabilityRisk: () => [...executiveKeys.all, "vulnerability-risk"] as const,
  threatRisk: () => [...executiveKeys.all, "threat-risk"] as const,
  incidentRisk: () => [...executiveKeys.all, "incident-risk"] as const,
  controlEffectiveness: () => [...executiveKeys.all, "control-effectiveness"] as const,
  complianceRisk: () => [...executiveKeys.all, "compliance-risk"] as const,
  recommendations: (limit: number, sort: string) => [...executiveKeys.all, "recommendations", limit, sort] as const,
  summary: () => [...executiveKeys.all, "summary"] as const,
  forecast: (days: number) => [...executiveKeys.all, "forecast", days] as const,
  securityInvestments: () => [...executiveKeys.all, "security-investments"] as const,
  reportHistory: (page: number) => ["report-history", page] as const,
  reportSchedules: () => ["report-schedules"] as const,
};

// ─── Dashboard & KPIs ─────────────────────────────────────────────────────────

export function useExecutiveDashboard(options?: UseQueryOptions) {
  return useQuery({
    queryKey: executiveKeys.dashboard(),
    queryFn: api.getExecutiveDashboard,
    staleTime: 2 * 60 * 1000, // 2 min
    ...(options as object),
  });
}

export function useExecutiveKPIs(options?: UseQueryOptions) {
  return useQuery({
    queryKey: executiveKeys.kpis(),
    queryFn: api.getExecutiveKPIs,
    staleTime: 2 * 60 * 1000,
    ...(options as object),
  });
}

// ─── Risk Trend & Drivers ─────────────────────────────────────────────────────

export function useRiskTrend(periodDays = 30) {
  return useQuery({
    queryKey: executiveKeys.riskTrend(periodDays),
    queryFn: () => api.getRiskTrend(periodDays),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRiskDrivers(periodDays = 30) {
  return useQuery({
    queryKey: executiveKeys.riskDrivers(periodDays),
    queryFn: () => api.getRiskDrivers(periodDays),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Financial Risk ───────────────────────────────────────────────────────────

export function useExecutiveFinancialRisk() {
  return useQuery({
    queryKey: executiveKeys.financialRisk(),
    queryFn: api.getExecutiveFinancialRisk,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinancialRiskTrend(periodDays = 30) {
  return useQuery({
    queryKey: executiveKeys.financialTrend(periodDays),
    queryFn: () => api.getFinancialRiskTrend(periodDays),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLossDistribution() {
  return useQuery({
    queryKey: executiveKeys.lossDistribution(),
    queryFn: api.getLossDistribution,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Aggregated Risk Views ────────────────────────────────────────────────────

export function useBusinessServiceRisk(sortBy = "risk_score") {
  return useQuery({
    queryKey: executiveKeys.businessServices(sortBy),
    queryFn: () => api.getBusinessServiceRisk(sortBy),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssetRisk(limit = 20, sortBy = "risk_score") {
  return useQuery({
    queryKey: executiveKeys.assetRisk(limit, sortBy),
    queryFn: () => api.getAssetRisk(limit, sortBy),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBusinessUnitRisk() {
  return useQuery({
    queryKey: executiveKeys.businessUnits(),
    queryFn: api.getBusinessUnitRisk,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopRisks(limit = 10) {
  return useQuery({
    queryKey: executiveKeys.topRisks(limit),
    queryFn: () => api.getTopRisks(limit),
    staleTime: 3 * 60 * 1000,
  });
}

export function useAttackPathRisk() {
  return useQuery({
    queryKey: executiveKeys.attackPaths(),
    queryFn: api.getAttackPathRisk,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Domain Risk Views ────────────────────────────────────────────────────────

export function useVulnerabilityRisk() {
  return useQuery({
    queryKey: executiveKeys.vulnerabilityRisk(),
    queryFn: api.getVulnerabilityRisk,
    staleTime: 5 * 60 * 1000,
  });
}

export function useThreatRisk() {
  return useQuery({
    queryKey: executiveKeys.threatRisk(),
    queryFn: api.getThreatRisk,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIncidentRisk() {
  return useQuery({
    queryKey: executiveKeys.incidentRisk(),
    queryFn: api.getIncidentRisk,
    staleTime: 3 * 60 * 1000,
  });
}

export function useControlEffectiveness() {
  return useQuery({
    queryKey: executiveKeys.controlEffectiveness(),
    queryFn: api.getControlEffectiveness,
    staleTime: 5 * 60 * 1000,
  });
}

export function useComplianceRisk() {
  return useQuery({
    queryKey: executiveKeys.complianceRisk(),
    queryFn: api.getComplianceRisk,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Recommendations & Summary ────────────────────────────────────────────────

export function useRecommendations(limit = 10, sortBy = "risk_impact") {
  return useQuery({
    queryKey: executiveKeys.recommendations(limit, sortBy),
    queryFn: () => api.getRecommendations(limit, sortBy),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExecutiveSummary() {
  return useQuery({
    queryKey: executiveKeys.summary(),
    queryFn: api.getExecutiveSummary,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export function useForecast(periodDays = 90) {
  return useQuery({
    queryKey: executiveKeys.forecast(periodDays),
    queryFn: () => api.getForecast(periodDays),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Security Investments ─────────────────────────────────────────────────────

export function useSecurityInvestments() {
  return useQuery({
    queryKey: executiveKeys.securityInvestments(),
    queryFn: api.getSecurityInvestments,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export function useRunScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScenarioCreate) => api.runScenario(payload),
    onSuccess: () => {
      // Scenarios don't invalidate dashboard since they are projections, not live data
    },
  });
}

// ─── Risk Acceptance ──────────────────────────────────────────────────────────

export function useCreateRiskAcceptance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RiskAcceptanceCreate) => api.createRiskAcceptance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.topRisks(10) });
    },
  });
}

export function useApproveRiskAcceptance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.approveRiskAcceptance(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
    },
  });
}

export function useRejectRiskAcceptance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.rejectRiskAcceptance(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.all });
    },
  });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useReportHistory(page = 1) {
  return useQuery({
    queryKey: executiveKeys.reportHistory(page),
    queryFn: () => api.getReportHistory(page),
    staleTime: 2 * 60 * 1000,
  });
}

export function useReportSchedules() {
  return useQuery({
    queryKey: executiveKeys.reportSchedules(),
    queryFn: api.getReportSchedules,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReportScheduleCreate) => api.createReportSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.reportSchedules() });
    },
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteReportSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: executiveKeys.reportSchedules() });
    },
  });
}
