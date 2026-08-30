import { apiClient } from "@/lib/api/client";
import {
  SOCDashboard,
  SOCMetrics,
  SOCTrendData,
  SOCHitMapItem,
  IncidentTriageResult,
  IncidentNote,
  IncidentRelationshipGraphData,
  SOCTask,
} from "./types";
import {
  IncidentTriageInput,
  IncidentAssignmentInput,
  IncidentNoteInput,
  IncidentReviewInput,
  IncidentCommunicationInput,
  SOCTaskCreateInput,
} from "./schemas";

export const socApi = {
  getDashboard: async (): Promise<SOCDashboard> => {
    return apiClient.get<SOCDashboard>("/soc/dashboard");
  },

  getMetrics: async (): Promise<SOCMetrics> => {
    return apiClient.get<SOCMetrics>("/soc/metrics");
  },

  getTrends: async (period: string = "30d"): Promise<SOCTrendData> => {
    return apiClient.get<SOCTrendData>("/soc/trends", { params: { period } });
  },

  getRiskMap: async (): Promise<{ items: SOCHitMapItem[] }> => {
    return apiClient.get<{ items: SOCHitMapItem[] }>("/soc/risk-map");
  },

  triageIncident: async (incidentId: string, payload: IncidentTriageInput): Promise<IncidentTriageResult> => {
    return apiClient.post<IncidentTriageResult>(`/soc/incidents/${incidentId}/triage`, payload);
  },

  assignIncident: async (incidentId: string, payload: IncidentAssignmentInput): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/soc/incidents/${incidentId}/assign`, payload);
  },

  getIncidentNotes: async (incidentId: string): Promise<IncidentNote[]> => {
    return apiClient.get<IncidentNote[]>(`/soc/incidents/${incidentId}/notes`);
  },

  addIncidentNote: async (incidentId: string, payload: IncidentNoteInput): Promise<IncidentNote> => {
    return apiClient.post<IncidentNote>(`/soc/incidents/${incidentId}/notes`, payload);
  },

  getIncidentReview: async (incidentId: string): Promise<Record<string, any>> => {
    return apiClient.get<Record<string, any>>(`/soc/incidents/${incidentId}/review`);
  },

  createIncidentReview: async (incidentId: string, payload: IncidentReviewInput): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/soc/incidents/${incidentId}/review`, payload);
  },

  sendIncidentCommunication: async (
    incidentId: string,
    payload: IncidentCommunicationInput
  ): Promise<Record<string, any>> => {
    return apiClient.post<Record<string, any>>(`/soc/incidents/${incidentId}/communications`, payload);
  },

  getRelationshipGraph: async (incidentId: string): Promise<IncidentRelationshipGraphData> => {
    return apiClient.get<IncidentRelationshipGraphData>(`/soc/incidents/${incidentId}/relationship-graph`);
  },

  getTasks: async (): Promise<SOCTask[]> => {
    return apiClient.get<SOCTask[]>("/soc/tasks");
  },

  createTask: async (payload: SOCTaskCreateInput): Promise<SOCTask> => {
    return apiClient.post<SOCTask>("/soc/tasks", payload);
  },

  updateTask: async (taskId: string, payload: { status?: string; owner?: string; priority?: string }): Promise<SOCTask> => {
    return apiClient.put<SOCTask>(`/soc/tasks/${taskId}`, payload);
  },
};
