import { apiClient } from "@/lib/api/client";
import { AlertCorrelationGroup, AlertDetail, AlertSummary, DetailedAlert } from "./types";
import { AlertAssignInput, AlertFalsePositiveInput, AlertResolveInput } from "./schemas";

export const alertsApi = {
  getSummary: async (): Promise<AlertSummary> => {
    return apiClient.get<AlertSummary>("/alerts-management/summary");
  },

  getAlerts: async (params?: { severity?: string; status?: string; asset_id?: string }): Promise<DetailedAlert[]> => {
    return apiClient.get<DetailedAlert[]>("/alerts-management/", { params });
  },

  getCorrelations: async (): Promise<AlertCorrelationGroup[]> => {
    return apiClient.get<AlertCorrelationGroup[]>("/alerts-management/correlations");
  },

  getAlertById: async (alertId: string): Promise<AlertDetail> => {
    return apiClient.get<AlertDetail>(`/alerts-management/${alertId}`);
  },

  assignAlert: async (alertId: string, payload: AlertAssignInput): Promise<DetailedAlert> => {
    return apiClient.post<DetailedAlert>(`/alerts-management/${alertId}/assign`, payload);
  },

  resolveAlert: async (alertId: string, payload: AlertResolveInput): Promise<DetailedAlert> => {
    return apiClient.post<DetailedAlert>(`/alerts-management/${alertId}/resolve`, payload);
  },

  markFalsePositive: async (alertId: string, payload: AlertFalsePositiveInput): Promise<DetailedAlert> => {
    return apiClient.post<DetailedAlert>(`/alerts-management/${alertId}/false-positive`, payload);
  },
};
