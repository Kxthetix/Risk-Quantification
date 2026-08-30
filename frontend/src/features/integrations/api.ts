import { apiClient } from "@/lib/api/client";
import type {
  DataQualityStats,
  IntegrationCatalogItem,
  IntegrationCreatePayload,
  IntegrationItem,
  IntegrationLogItem,
  IntegrationStats,
  IntegrationSyncResult,
  IntegrationTestResult,
  IntegrationUpdatePayload,
  WebhookEndpointItem,
} from "./types";

const BASE = "/integrations";

// Catalog & Stats
export async function getConnectorCatalog(): Promise<IntegrationCatalogItem[]> {
  return apiClient.get(`${BASE}/catalog`);
}

export async function getIntegrationStats(): Promise<IntegrationStats> {
  return apiClient.get(`${BASE}/stats`);
}

export async function getDataQualityStats(): Promise<DataQualityStats> {
  return apiClient.get(`${BASE}/data`);
}

// Integrations CRUD
export async function getIntegrations(category?: string, status?: string): Promise<IntegrationItem[]> {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.set("category", category);
  if (status) params.set("status", status);
  const qStr = params.toString() ? `?${params.toString()}` : "";
  return apiClient.get(`${BASE}${qStr}`);
}

export async function getIntegration(id: string): Promise<IntegrationItem> {
  return apiClient.get(`${BASE}/${id}`);
}

export async function createIntegration(payload: IntegrationCreatePayload): Promise<IntegrationItem> {
  return apiClient.post(BASE, payload);
}

export async function updateIntegration(id: string, payload: IntegrationUpdatePayload): Promise<IntegrationItem> {
  return apiClient.put(`${BASE}/${id}`, payload);
}

export async function deleteIntegration(id: string): Promise<void> {
  return apiClient.delete(`${BASE}/${id}`);
}

// Actions: Test & Sync
export async function testIntegrationConnection(
  id: string,
  payload?: { endpoint_url?: string; credentials?: Record<string, any> }
): Promise<IntegrationTestResult> {
  return apiClient.post(`${BASE}/${id}/test`, payload || {});
}

export async function syncIntegration(
  id: string,
  payload?: { sync_mode?: "INCREMENTAL" | "FULL" }
): Promise<IntegrationSyncResult> {
  return apiClient.post(`${BASE}/${id}/sync`, payload || {});
}

export async function getIntegrationLogs(id: string, limit: number = 50): Promise<IntegrationLogItem[]> {
  return apiClient.get(`${BASE}/${id}/logs?limit=${limit}`);
}

// Webhooks
export async function getWebhooks(): Promise<WebhookEndpointItem[]> {
  return apiClient.get("/webhooks");
}

export async function createWebhook(payload: { name: string; event_types: string[] }): Promise<WebhookEndpointItem> {
  return apiClient.post("/webhooks", payload);
}

export async function deleteWebhook(id: string): Promise<void> {
  return apiClient.delete(`/webhooks/${id}`);
}
