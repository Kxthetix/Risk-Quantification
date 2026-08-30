import { apiClient } from "@/lib/api/client";
import {
  Remediation,
  RemediationCreateInput,
  RemediationPriorityLevel,
  RemediationSimulateResponse,
  RemediationStatus,
  RemediationUpdateInput,
  RemediationVerifyInput,
  RiskAcceptanceInput,
  TopRemediationsResponse,
} from "./types";

export const remediationApi = {
  getRemediations: async (params?: {
    status?: RemediationStatus;
    priority_level?: RemediationPriorityLevel;
    limit?: number;
    offset?: number;
  }): Promise<{ remediations: Remediation[]; total: number }> => {
    return apiClient.get<{ remediations: Remediation[]; total: number }>("/api/v1/remediations", {
      params,
    });
  },

  getTopRemediations: async (params?: {
    limit?: number;
    priority_level?: RemediationPriorityLevel;
    asset_id?: string;
    max_cost?: number;
  }): Promise<TopRemediationsResponse> => {
    return apiClient.get<TopRemediationsResponse>("/api/v1/remediations/top", { params });
  },

  getRemediation: async (remediationId: string): Promise<Remediation> => {
    return apiClient.get<Remediation>(`/api/v1/remediations/${remediationId}`);
  },

  createRemediation: async (payload: RemediationCreateInput): Promise<Remediation> => {
    return apiClient.post<Remediation>("/api/v1/remediations", payload);
  },

  updateRemediation: async (
    remediationId: string,
    payload: RemediationUpdateInput
  ): Promise<Remediation> => {
    return apiClient.put<Remediation>(`/api/v1/remediations/${remediationId}`, payload);
  },

  deleteRemediation: async (remediationId: string): Promise<void> => {
    return apiClient.delete<void>(`/api/v1/remediations/${remediationId}`);
  },

  simulateRemediation: async (remediationId: string): Promise<RemediationSimulateResponse> => {
    return apiClient.post<RemediationSimulateResponse>(
      `/api/v1/remediations/${remediationId}/simulate`,
      {}
    );
  },

  completeRemediation: async (remediationId: string): Promise<Remediation> => {
    return apiClient.post<Remediation>(`/api/v1/remediations/${remediationId}/complete`, {});
  },

  verifyRemediation: async (
    remediationId: string,
    payload: RemediationVerifyInput
  ): Promise<Remediation> => {
    return apiClient.post<Remediation>(`/api/v1/remediations/${remediationId}/verify`, payload);
  },

  acceptRisk: async (
    remediationId: string,
    payload: RiskAcceptanceInput
  ): Promise<Remediation> => {
    return apiClient.post<Remediation>(
      `/api/v1/remediations/${remediationId}/accept-risk`,
      payload
    );
  },
};
