import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { securityApi } from "./api";
import { UserSession, AuditLogEvent, AuditLogFilterParams } from "./types";
import { useToast } from "@/providers/ToastProvider";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export const SECURITY_QUERY_KEYS = {
  sessions: ["security", "sessions"] as const,
  auditLogs: (params?: AuditLogFilterParams) => ["security", "audit", params] as const,
  auditEvent: (id?: string) => ["security", "audit", "detail", id] as const,
};

export function useUserSessions() {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.sessions,
    queryFn: () => securityApi.getSessions(),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (sessionId: string) => securityApi.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.sessions });
      toast({
        title: "Session Revoked",
        description: "The remote session has been terminated.",
        variant: "info",
      });
    },
    onError: (error) => {
      toast({
        title: "Revocation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => securityApi.revokeAllOtherSessions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: SECURITY_QUERY_KEYS.sessions });
      toast({
        title: "All Other Sessions Revoked",
        description: `${data.revoked_count ?? "All"} other active sessions have been terminated.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Mass revocation failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}

export function useAuditLogs(params: AuditLogFilterParams = {}) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.auditLogs(params),
    queryFn: () => securityApi.getAuditLogs(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAuditEvent(eventId?: string) {
  return useQuery({
    queryKey: SECURITY_QUERY_KEYS.auditEvent(eventId),
    queryFn: () => securityApi.getAuditEvent(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useExportAuditLogs() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      format,
      params,
    }: {
      format: "csv" | "json";
      params?: AuditLogFilterParams;
    }) => {
      if (format === "csv") {
        return securityApi.exportAuditLogsCsv(params);
      }
      return securityApi.exportAuditLogsJson(params);
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Completed",
        description: `Audit log file downloaded in ${variables.format.toUpperCase()} format.`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: getFriendlyErrorMessage(error),
        variant: "error",
      });
    },
  });
}
