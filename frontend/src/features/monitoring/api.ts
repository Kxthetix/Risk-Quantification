import { apiClient } from "@/lib/api/client";
import {
  DataSourceHealth,
  MonitoringDashboard,
  MonitoringHealth,
  SecurityEventDetail,
  SecurityEventsListResponse,
} from "./types";
import { EventFilterInput } from "./schemas";

export const monitoringApi = {
  getDashboard: async (): Promise<MonitoringDashboard> => {
    return apiClient.get<MonitoringDashboard>("/monitoring/dashboard");
  },

  getEvents: async (params?: EventFilterInput): Promise<SecurityEventsListResponse> => {
    return apiClient.get<SecurityEventsListResponse>("/monitoring/events", { params });
  },

  getEventById: async (eventId: string): Promise<SecurityEventDetail> => {
    return apiClient.get<SecurityEventDetail>(`/monitoring/events/${eventId}`);
  },

  getDataSources: async (): Promise<DataSourceHealth[]> => {
    return apiClient.get<DataSourceHealth[]>("/monitoring/data-sources");
  },

  getHealth: async (): Promise<MonitoringHealth> => {
    return apiClient.get<MonitoringHealth>("/monitoring/health");
  },
};
