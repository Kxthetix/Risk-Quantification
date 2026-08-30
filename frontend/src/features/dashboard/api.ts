import { apiClient } from "@/lib/api/client";
import {
  ExecutiveDashboard,
  ExecutiveKPIs,
  RiskOverview,
  RiskTrendResponse,
  FinancialRiskResponse,
  FinancialTrendResponse,
  FinancialServiceRisk,
  FinancialAssetRisk,
  TopCyberRiskFinding,
  TopAttackPathItem,
  AttackSurfaceResponse,
  VulnerabilityOverviewResponse,
  RemediationDashboardResponse,
  InvestmentDashboardResponse,
  RiskHeatmapResponse,
  BusinessServiceRisk,
} from "./types";

export const dashboardApi = {
  getExecutiveDashboard: async (period: string = "30d"): Promise<ExecutiveDashboard> => {
    return apiClient.get<ExecutiveDashboard>("/dashboard/executive", {
      params: { period },
    });
  },

  getKPIs: async (): Promise<ExecutiveKPIs> => {
    return apiClient.get<ExecutiveKPIs>("/dashboard/kpis");
  },

  getRiskOverview: async (): Promise<RiskOverview> => {
    return apiClient.get<RiskOverview>("/dashboard/risk-overview");
  },

  getRiskTrend: async (period: string = "30d"): Promise<RiskTrendResponse> => {
    return apiClient.get<RiskTrendResponse>("/dashboard/risk-trend", {
      params: { period },
    });
  },

  getFinancialRisk: async (): Promise<FinancialRiskResponse> => {
    return apiClient.get<FinancialRiskResponse>("/dashboard/financial-risk");
  },

  getFinancialTrend: async (period: string = "30d"): Promise<FinancialTrendResponse> => {
    return apiClient.get<FinancialTrendResponse>("/dashboard/financial-trend", {
      params: { period },
    });
  },

  getFinancialServicesRisk: async (): Promise<FinancialServiceRisk[]> => {
    return apiClient.get<FinancialServiceRisk[]>("/dashboard/financial-risk/business-services");
  },

  getFinancialAssetsRisk: async (limit: number = 10): Promise<FinancialAssetRisk[]> => {
    return apiClient.get<FinancialAssetRisk[]>("/dashboard/financial-risk/assets", {
      params: { limit },
    });
  },

  getTopRisks: async (limit: number = 10): Promise<TopCyberRiskFinding[]> => {
    return apiClient.get<TopCyberRiskFinding[]>("/dashboard/top-risks", {
      params: { limit },
    });
  },

  getTopAttackPaths: async (limit: number = 10): Promise<TopAttackPathItem[]> => {
    return apiClient.get<TopAttackPathItem[]>("/dashboard/top-attack-paths", {
      params: { limit },
    });
  },

  getAttackSurface: async (): Promise<AttackSurfaceResponse> => {
    return apiClient.get<AttackSurfaceResponse>("/dashboard/attack-surface");
  },

  getVulnerabilityOverview: async (periodDays: number = 30): Promise<VulnerabilityOverviewResponse> => {
    return apiClient.get<VulnerabilityOverviewResponse>("/dashboard/vulnerabilities", {
      params: { period_days: periodDays },
    });
  },

  getRemediationDashboard: async (): Promise<RemediationDashboardResponse> => {
    return apiClient.get<RemediationDashboardResponse>("/dashboard/remediation");
  },

  getInvestmentDashboard: async (): Promise<InvestmentDashboardResponse> => {
    return apiClient.get<InvestmentDashboardResponse>("/dashboard/investment");
  },

  getRiskHeatmap: async (): Promise<RiskHeatmapResponse> => {
    return apiClient.get<RiskHeatmapResponse>("/dashboard/risk-heatmap");
  },

  getBusinessRisk: async (): Promise<BusinessServiceRisk[]> => {
    return apiClient.get<BusinessServiceRisk[]>("/dashboard/business-risk");
  },

  generateExecutiveReport: async (payload: {
    title?: string;
    report_type: string;
    format: "PDF" | "CSV" | "JSON";
    period?: string;
  }): Promise<{ id: string; status: string; file_url?: string }> => {
    return apiClient.post<{ id: string; status: string; file_url?: string }>(
      "/reports",
      payload
    );
  },
};
