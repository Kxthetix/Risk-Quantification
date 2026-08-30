import { useQuery } from "@tanstack/react-query";
import { getAuditLogDetail, getAuditLogs } from "./api";
import type { AuditLogFilters } from "./types";

export const AUDIT_KEYS = {
  all: ["audit"] as const,
  list: (filters?: AuditLogFilters) => ["audit", "list", filters] as const,
  detail: (id: string) => ["audit", "detail", id] as const,
};

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: AUDIT_KEYS.list(filters),
    queryFn: () => getAuditLogs(filters),
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery({
    queryKey: AUDIT_KEYS.detail(id || ""),
    queryFn: () => getAuditLogDetail(id!),
    enabled: Boolean(id),
  });
}
