// Executive feature – API client (Phase 11)
import { apiClient } from "@/lib/api/client";
import type {
  AssetRiskResponse,
  AttackPathRiskResponse,
  BusinessServiceRiskResponse,
  BusinessUnitRiskResponse,
  ComplianceRiskResponse,
  ControlEffectivenessResponse,
  ExecutiveDashboard,
  ExecutiveFilters,
  ExecutiveFinancialRisk,
  ExecutiveKPI,
  ExecutiveSummary,
  ExecutiveTopRisksResponse,
  FinancialTrendResponse,
  ForecastResponse,
  IncidentRiskResponse,
  LossDistributionResponse,
  RecommendationsResponse,
  RiskAcceptanceCreate,
  RiskAcceptanceResponse,
  RiskDriverResponse,
  RiskTrendResponse,
  ScenarioCreate,
  ScenarioResult,
  SecurityInvestmentResponse,
  ThreatRiskResponse,
  VulnerabilityRiskResponse,
  ReportHistoryResponse,
  ReportSchedule,
  ReportScheduleCreate,
} from "./types";

const BASE = "/executive";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getExecutiveDashboard(): Promise<ExecutiveDashboard> {
  return apiClient.get(`${BASE}/dashboard`);
}

export async function getExecutiveKPIs(): Promise<ExecutiveKPI[]> {
  return apiClient.get(`${BASE}/kpis`);
}

// ─── Risk Trend & Drivers ─────────────────────────────────────────────────────

export async function getRiskTrend(period_days = 30): Promise<RiskTrendResponse> {
  return apiClient.get(`${BASE}/risk-trend?period_days=${period_days}`);
}

export async function getRiskDrivers(period_days = 30): Promise<RiskDriverResponse> {
  return apiClient.get(`${BASE}/risk-drivers?period_days=${period_days}`);
}

// ─── Financial Risk ───────────────────────────────────────────────────────────

export async function getExecutiveFinancialRisk(): Promise<ExecutiveFinancialRisk> {
  return apiClient.get(`${BASE}/financial-risk`);
}

export async function getFinancialRiskTrend(period_days = 30): Promise<FinancialTrendResponse> {
  return apiClient.get(`${BASE}/financial-risk/trend?period_days=${period_days}`);
}

export async function getLossDistribution(): Promise<LossDistributionResponse> {
  return apiClient.get(`${BASE}/loss-distribution`);
}

// ─── Aggregated Risk Views ────────────────────────────────────────────────────

export async function getBusinessServiceRisk(
  sort_by = "risk_score"
): Promise<BusinessServiceRiskResponse> {
  return apiClient.get(`${BASE}/business-services?sort_by=${sort_by}`);
}

export async function getAssetRisk(
  limit = 20,
  sort_by = "risk_score"
): Promise<AssetRiskResponse> {
  return apiClient.get(`${BASE}/asset-risk?limit=${limit}&sort_by=${sort_by}`);
}

export async function getBusinessUnitRisk(): Promise<BusinessUnitRiskResponse> {
  return apiClient.get(`${BASE}/business-units`);
}

export async function getTopRisks(limit = 10): Promise<ExecutiveTopRisksResponse> {
  return apiClient.get(`${BASE}/top-risks?limit=${limit}`);
}

export async function getAttackPathRisk(): Promise<AttackPathRiskResponse> {
  return apiClient.get(`${BASE}/attack-path-risk`);
}

// ─── Domain Risk Views ────────────────────────────────────────────────────────

export async function getVulnerabilityRisk(): Promise<VulnerabilityRiskResponse> {
  return apiClient.get(`${BASE}/vulnerability-risk`);
}

export async function getThreatRisk(): Promise<ThreatRiskResponse> {
  return apiClient.get(`${BASE}/threat-risk`);
}

export async function getIncidentRisk(): Promise<IncidentRiskResponse> {
  return apiClient.get(`${BASE}/incident-risk`);
}

export async function getControlEffectiveness(): Promise<ControlEffectivenessResponse> {
  return apiClient.get(`${BASE}/control-effectiveness`);
}

export async function getComplianceRisk(): Promise<ComplianceRiskResponse> {
  return apiClient.get(`${BASE}/compliance-risk`);
}

// ─── Recommendations & Summary ────────────────────────────────────────────────

export async function getRecommendations(
  limit = 10,
  sort_by = "risk_impact"
): Promise<RecommendationsResponse> {
  return apiClient.get(`${BASE}/recommendations?limit=${limit}&sort_by=${sort_by}`);
}

export async function getExecutiveSummary(): Promise<ExecutiveSummary> {
  return apiClient.get(`${BASE}/summary`);
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export async function getForecast(period_days = 90): Promise<ForecastResponse> {
  return apiClient.get(`${BASE}/forecast?period_days=${period_days}`);
}

// ─── Security Investments ─────────────────────────────────────────────────────

export async function getSecurityInvestments(): Promise<SecurityInvestmentResponse> {
  return apiClient.get(`${BASE}/security-investments`);
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

export async function runScenario(payload: ScenarioCreate): Promise<ScenarioResult> {
  return apiClient.post(`${BASE}/scenarios`, payload);
}

// ─── Risk Acceptance ──────────────────────────────────────────────────────────

export async function createRiskAcceptance(
  payload: RiskAcceptanceCreate
): Promise<RiskAcceptanceResponse> {
  return apiClient.post(`${BASE}/risk-acceptance`, payload);
}

export async function approveRiskAcceptance(
  id: string,
  notes?: string
): Promise<RiskAcceptanceResponse> {
  return apiClient.put(`${BASE}/risk-acceptance/${id}/approve`, { notes });
}

export async function rejectRiskAcceptance(
  id: string,
  notes?: string
): Promise<RiskAcceptanceResponse> {
  return apiClient.put(`${BASE}/risk-acceptance/${id}/reject`, { notes });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReportHistory(
  page = 1,
  page_size = 20
): Promise<ReportHistoryResponse> {
  return apiClient.get(`/reports/history?page=${page}&page_size=${page_size}`);
}

export async function getReportSchedules(): Promise<ReportSchedule[]> {
  return apiClient.get(`/reports/schedules`);
}

export async function createReportSchedule(payload: ReportScheduleCreate): Promise<ReportSchedule> {
  return apiClient.post(`/reports/schedules`, payload);
}

export async function updateReportSchedule(
  id: string,
  payload: Partial<ReportScheduleCreate>
): Promise<ReportSchedule> {
  return apiClient.put(`/reports/schedules/${id}`, payload);
}

export async function deleteReportSchedule(id: string): Promise<void> {
  return apiClient.delete(`/reports/schedules/${id}`);
}
