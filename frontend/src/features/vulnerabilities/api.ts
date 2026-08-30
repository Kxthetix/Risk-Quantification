import { apiClient } from "@/lib/api/client";
import {
  Vulnerability,
  VulnerabilityDetail,
  VulnerabilityListResponse,
  VulnerabilityStatistics,
  SyncJobInfo,
  AssetVulnerability,
} from "@/types/vulnerability";
import {
  VulnerabilityFilterParams,
  RemediationCreatePayload,
  RiskAcceptancePayload,
  VulnerabilityRiskBreakdown,
  ThreatIntelligenceSummary,
  VulnerabilityFinancialSummary,
  PrioritizationMatrixPoint,
} from "./types";

export const vulnerabilitiesApi = {
  list: async (params?: VulnerabilityFilterParams): Promise<VulnerabilityListResponse> => {
    return apiClient.get<VulnerabilityListResponse>("/vulnerabilities", { params });
  },

  getStatistics: async (): Promise<VulnerabilityStatistics> => {
    return apiClient.get<VulnerabilityStatistics>("/vulnerabilities/statistics");
  },

  search: async (q: string, page: number = 1, limit: number = 20): Promise<VulnerabilityListResponse> => {
    return apiClient.get<VulnerabilityListResponse>("/vulnerabilities/search", {
      params: { q, page, limit },
    });
  },

  getByCveId: async (cveId: string): Promise<VulnerabilityDetail> => {
    return apiClient.get<VulnerabilityDetail>(`/vulnerabilities/${cveId}`);
  },

  triggerNvdSync: async (maxRecords: number = 100, cveId?: string): Promise<SyncJobInfo> => {
    return apiClient.post<SyncJobInfo>("/vulnerabilities/sync", null, {
      params: { max_records: maxRecords, cve_id: cveId },
    });
  },

  getSyncJobStatus: async (jobId: string): Promise<SyncJobInfo> => {
    return apiClient.get<SyncJobInfo>(`/vulnerabilities/sync/${jobId}`);
  },

  matchInventory: async (assetId?: string): Promise<{ assets_processed: number; software_processed: number; matches_found: number }> => {
    return apiClient.post<{ assets_processed: number; software_processed: number; matches_found: number }>(
      "/vulnerabilities/match",
      assetId ? { asset_id: assetId } : {}
    );
  },

  getValidationQueue: async (limit: number = 50, offset: number = 0): Promise<any[]> => {
    return apiClient.get<any[]>("/validation/review-queue", {
      params: { limit, offset },
    });
  },

  runValidation: async (assetVulnerabilityId: string, synchronous: boolean = true): Promise<{ validation_id: string; status: string }> => {
    return apiClient.post<{ validation_id: string; status: string }>("/validation/run", {
      asset_vulnerability_id: assetVulnerabilityId,
      synchronous,
    });
  },

  createRemediation: async (payload: RemediationCreatePayload): Promise<any> => {
    return apiClient.post<any>("/remediations", payload);
  },

  acceptRisk: async (remediationId: string, payload: RiskAcceptancePayload): Promise<any> => {
    return apiClient.post<any>(`/remediations/${remediationId}/accept-risk`, payload);
  },

  exportCsv: async (): Promise<Blob> => {
    const response = await fetch("/api/v1/vulnerabilities", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cyber_risk_auth_token") || ""}`,
      },
    });
    return response.blob();
  },
};
