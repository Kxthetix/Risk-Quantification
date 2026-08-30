import { apiClient } from "@/lib/api/client";
import type { AuditLogDetail, AuditLogFilters, AuditLogItem } from "./types";

const BASE = "/audit";

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogItem[]> {
  const query = new URLSearchParams();
  if (filters?.action) query.set("action", filters.action);
  if (filters?.resource_type) query.set("resource_type", filters.resource_type);
  if (filters?.user_id) query.set("user_id", filters.user_id);
  if (filters?.skip !== undefined) query.set("skip", String(filters.skip));
  if (filters?.limit !== undefined) query.set("limit", String(filters.limit));

  const qStr = query.toString() ? `?${query.toString()}` : "";
  return apiClient.get(`${BASE}${qStr}`);
}

export async function getAuditLogDetail(id: string): Promise<AuditLogDetail> {
  return apiClient.get(`${BASE}/${id}`);
}

export function getAuditExportUrl(format: "csv" | "json" = "csv"): string {
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}${BASE}/export?format=${format}`;
}
