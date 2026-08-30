import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "./api";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const DASHBOARD_QUERY_KEYS = {
  executive: (period?: string) => ["dashboard", "executive", period] as const,
  kpis: ["dashboard", "kpis"] as const,
  riskOverview: ["dashboard", "riskOverview"] as const,
  riskTrend: (period?: string) => ["dashboard", "riskTrend", period] as const,
  financialRisk: ["dashboard", "financialRisk"] as const,
  financialTrend: (period?: string) => ["dashboard", "financialTrend", period] as const,
  financialServices: ["dashboard", "financialServices"] as const,
  financialAssets: (limit?: number) => ["dashboard", "financialAssets", limit] as const,
  topRisks: (limit?: number) => ["dashboard", "topRisks", limit] as const,
  topAttackPaths: (limit?: number) => ["dashboard", "topAttackPaths", limit] as const,
  attackSurface: ["dashboard", "attackSurface"] as const,
  vulnerabilities: (periodDays?: number) => ["dashboard", "vulnerabilities", periodDays] as const,
  remediation: ["dashboard", "remediation"] as const,
  investment: ["dashboard", "investment"] as const,
  riskHeatmap: ["dashboard", "riskHeatmap"] as const,
  businessRisk: ["dashboard", "businessRisk"] as const,
};

export function useExecutiveDashboard(period: string = "30d") {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.executive(period),
    queryFn: () => dashboardApi.getExecutiveDashboard(period),
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

export function useExecutiveKPIs() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.kpis,
    queryFn: () => dashboardApi.getKPIs(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useRiskOverview() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.riskOverview,
    queryFn: () => dashboardApi.getRiskOverview(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRiskTrend(period: string = "30d") {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.riskTrend(period),
    queryFn: () => dashboardApi.getRiskTrend(period),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialRisk() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.financialRisk,
    queryFn: () => dashboardApi.getFinancialRisk(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialTrend(period: string = "30d") {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.financialTrend(period),
    queryFn: () => dashboardApi.getFinancialTrend(period),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFinancialServicesRisk() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.financialServices,
    queryFn: () => dashboardApi.getFinancialServicesRisk(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTopRisks(limit: number = 10) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.topRisks(limit),
    queryFn: () => dashboardApi.getTopRisks(limit),
    staleTime: 1000 * 60 * 3,
  });
}

export function useTopAttackPaths(limit: number = 10) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.topAttackPaths(limit),
    queryFn: () => dashboardApi.getTopAttackPaths(limit),
    staleTime: 1000 * 60 * 3,
  });
}

export function useAttackSurface() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.attackSurface,
    queryFn: () => dashboardApi.getAttackSurface(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useVulnerabilityOverview(periodDays: number = 30) {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.vulnerabilities(periodDays),
    queryFn: () => dashboardApi.getVulnerabilityOverview(periodDays),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRemediationDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.remediation,
    queryFn: () => dashboardApi.getRemediationDashboard(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useInvestmentDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.investment,
    queryFn: () => dashboardApi.getInvestmentDashboard(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRiskHeatmap() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.riskHeatmap,
    queryFn: () => dashboardApi.getRiskHeatmap(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useBusinessRisk() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.businessRisk,
    queryFn: () => dashboardApi.getBusinessRisk(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useGenerateExecutiveReport() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: {
      title?: string;
      report_type: string;
      format: "PDF" | "CSV" | "JSON";
      period?: string;
    }) => dashboardApi.generateExecutiveReport(payload),
    onSuccess: (job) => {
      toast({
        title: "Report Queued for Compilation",
        description: `Your executive report job #${job.id.slice(0, 8)} is being generated.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Report generation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
