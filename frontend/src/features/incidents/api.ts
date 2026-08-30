import { apiClient } from "@/lib/api/client";
import { IncidentDetail, IncidentItem, IncidentSummary } from "./types";
import {
  IncidentActionInput,
  IncidentCommentInput,
  IncidentCreateInput,
  IncidentTaskInput,
  IncidentUpdateInput,
} from "./schemas";

export const incidentsApi = {
  getSummary: async (): Promise<IncidentSummary> => {
    return apiClient.get<IncidentSummary>("/incidents-management/summary");
  },

  getIncidents: async (params?: { status?: string; severity?: string; owner?: string }): Promise<IncidentItem[]> => {
    return apiClient.get<IncidentItem[]>("/incidents-management/", { params });
  },

  getIncidentById: async (incidentId: string): Promise<IncidentDetail> => {
    return apiClient.get<IncidentDetail>(`/incidents-management/${incidentId}`);
  },

  createIncident: async (payload: IncidentCreateInput): Promise<IncidentItem> => {
    return apiClient.post<IncidentItem>("/incidents-management/", payload);
  },

  updateIncident: async (incidentId: string, payload: IncidentUpdateInput): Promise<IncidentDetail> => {
    return apiClient.put<IncidentDetail>(`/incidents-management/${incidentId}`, payload);
  },

  addComment: async (incidentId: string, payload: IncidentCommentInput): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/incidents-management/${incidentId}/comments`, payload);
  },

  addTask: async (incidentId: string, payload: IncidentTaskInput): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/incidents-management/${incidentId}/tasks`, payload);
  },

  executeAction: async (incidentId: string, payload: IncidentActionInput): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/incidents-management/${incidentId}/actions`, payload);
  },
};
