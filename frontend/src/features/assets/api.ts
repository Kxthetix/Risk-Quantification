import { apiClient } from "@/lib/api/client";
import {
  Asset,
  AssetDetail,
  AssetListResponse,
  AssetStatistics,
  AssetSoftware,
  AssetVulnerability,
} from "@/types/asset";
import {
  AssetCreatePayload,
  AssetUpdatePayload,
  AssetPatchPayload,
  AssetFilterParams,
  ImportResult,
  NetworkRelationship,
  NetworkRelationshipCreatePayload,
  AssetRiskSummary,
} from "./types";

export const assetsApi = {
  list: async (params?: AssetFilterParams): Promise<AssetListResponse> => {
    return apiClient.get<AssetListResponse>("/assets", { params });
  },

  getStatistics: async (): Promise<AssetStatistics> => {
    return apiClient.get<AssetStatistics>("/assets/statistics");
  },

  search: async (q: string, page: number = 1, limit: number = 20): Promise<AssetListResponse> => {
    return apiClient.get<AssetListResponse>("/assets/search", {
      params: { q, page, limit },
    });
  },

  getById: async (id: string): Promise<AssetDetail> => {
    return apiClient.get<AssetDetail>(`/assets/${id}`);
  },

  create: async (payload: AssetCreatePayload): Promise<Asset> => {
    return apiClient.post<Asset>("/assets", payload);
  },

  update: async (id: string, payload: AssetUpdatePayload): Promise<Asset> => {
    return apiClient.put<Asset>(`/assets/${id}`, payload);
  },

  patch: async (id: string, payload: AssetPatchPayload): Promise<Asset> => {
    return apiClient.patch<Asset>(`/assets/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/assets/${id}`);
  },

  getRisk: async (id: string): Promise<AssetRiskSummary> => {
    return apiClient.get<AssetRiskSummary>(`/assets/${id}/risk`);
  },

  listVulnerabilities: async (id: string): Promise<{ asset_id: string; vulnerabilities: AssetVulnerability[]; total: number }> => {
    return apiClient.get<{ asset_id: string; vulnerabilities: AssetVulnerability[]; total: number }>(
      `/assets/${id}/vulnerabilities`
    );
  },

  listSoftware: async (id: string): Promise<{ asset_id: string; software: AssetSoftware[]; total: number }> => {
    return apiClient.get<{ asset_id: string; software: AssetSoftware[]; total: number }>(
      `/assets/${id}/software`
    );
  },

  attachSoftware: async (
    assetId: string,
    payload: {
      software_id?: string;
      name?: string;
      version?: string;
      vendor?: string;
      install_path?: string;
    }
  ): Promise<AssetSoftware> => {
    return apiClient.post<AssetSoftware>(`/assets/${assetId}/software`, payload);
  },

  detachSoftware: async (assetId: string, softwareId: string): Promise<void> => {
    return apiClient.delete<void>(`/assets/${assetId}/software/${softwareId}`);
  },

  importCsv: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResult>("/assets/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  validateImportCsv: async (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ImportResult>("/assets/import/validate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  exportCsv: async (): Promise<Blob> => {
    const response = await fetch("/api/v1/assets/export", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("cyber_risk_auth_token") || ""}`,
      },
    });
    return response.blob();
  },

  getRelationships: async (): Promise<NetworkRelationship[]> => {
    return apiClient.get<NetworkRelationship[]>("/network/relationships");
  },

  createRelationship: async (payload: NetworkRelationshipCreatePayload): Promise<NetworkRelationship> => {
    return apiClient.post<NetworkRelationship>("/network/relationships", payload);
  },

  deleteRelationship: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/network/relationships/${id}`);
  },

  calculateBulkRisk: async (assetIds?: string[], allOrg: boolean = false): Promise<{ status: string; processed_count: number }> => {
    return apiClient.post<{ status: string; processed_count: number }>("/risk/calculate-bulk", {
      asset_ids: assetIds,
      all_organization_assets: allOrg,
    });
  },
};
