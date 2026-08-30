import { apiClient } from "@/lib/api/client";
import { UserSession, AuditLogEvent, AuditLogFilterParams } from "./types";

export const securityApi = {
  getSessions: async (): Promise<UserSession[]> => {
    return apiClient.get<UserSession[]>("/auth/sessions");
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/auth/sessions/${sessionId}`);
  },

  revokeAllOtherSessions: async (): Promise<{ message: string; revoked_count: number }> => {
    return apiClient.delete<{ message: string; revoked_count: number }>("/auth/sessions");
  },

  getAuditLogs: async (params: AuditLogFilterParams = {}): Promise<AuditLogEvent[]> => {
    return apiClient.get<AuditLogEvent[]>("/audit/logs", { params });
  },

  getAuditEvent: async (eventId: string): Promise<AuditLogEvent> => {
    return apiClient.get<AuditLogEvent>(`/audit/logs/${eventId}`);
  },

  exportAuditLogsCsv: async (params: AuditLogFilterParams = {}): Promise<Blob> => {
    return apiClient.get<Blob>("/audit/logs/export/csv", {
      params,
      headers: { Accept: "text/csv" },
    });
  },

  exportAuditLogsJson: async (params: AuditLogFilterParams = {}): Promise<Blob> => {
    return apiClient.get<Blob>("/audit/logs/export/json", {
      params,
      headers: { Accept: "application/json" },
    });
  },
};
