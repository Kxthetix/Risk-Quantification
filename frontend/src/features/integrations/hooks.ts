import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createIntegration,
  createWebhook,
  deleteIntegration,
  deleteWebhook,
  getConnectorCatalog,
  getDataQualityStats,
  getIntegration,
  getIntegrationLogs,
  getIntegrations,
  getIntegrationStats,
  getWebhooks,
  syncIntegration,
  testIntegrationConnection,
  updateIntegration,
} from "./api";
import type { IntegrationCreatePayload, IntegrationUpdatePayload } from "./types";

export const INTEGRATION_KEYS = {
  all: ["integrations"] as const,
  catalog: ["integrations", "catalog"] as const,
  stats: ["integrations", "stats"] as const,
  dataQuality: ["integrations", "data-quality"] as const,
  list: (category?: string, status?: string) => ["integrations", "list", category, status] as const,
  detail: (id: string) => ["integrations", "detail", id] as const,
  logs: (id: string) => ["integrations", "logs", id] as const,
  webhooks: ["webhooks"] as const,
};

export function useConnectorCatalog() {
  return useQuery({
    queryKey: INTEGRATION_KEYS.catalog,
    queryFn: getConnectorCatalog,
  });
}

export function useIntegrationStats() {
  return useQuery({
    queryKey: INTEGRATION_KEYS.stats,
    queryFn: getIntegrationStats,
    refetchInterval: 20000,
  });
}

export function useDataQualityStats() {
  return useQuery({
    queryKey: INTEGRATION_KEYS.dataQuality,
    queryFn: getDataQualityStats,
  });
}

export function useIntegrations(category?: string, status?: string) {
  return useQuery({
    queryKey: INTEGRATION_KEYS.list(category, status),
    queryFn: () => getIntegrations(category, status),
  });
}

export function useIntegration(id: string | null) {
  return useQuery({
    queryKey: INTEGRATION_KEYS.detail(id || ""),
    queryFn: () => getIntegration(id!),
    enabled: Boolean(id),
  });
}

export function useIntegrationLogs(id: string | null) {
  return useQuery({
    queryKey: INTEGRATION_KEYS.logs(id || ""),
    queryFn: () => getIntegrationLogs(id!),
    enabled: Boolean(id),
  });
}

export function useCreateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IntegrationCreatePayload) => createIntegration(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.all });
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: IntegrationUpdatePayload }) =>
      updateIntegration(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.all });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { endpoint_url?: string; credentials?: Record<string, any> } }) =>
      testIntegrationConnection(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.stats });
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { sync_mode?: "INCREMENTAL" | "FULL" } }) =>
      syncIntegration(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.logs(variables.id) });
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.dataQuality });
    },
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: INTEGRATION_KEYS.webhooks,
    queryFn: getWebhooks,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.webhooks });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTEGRATION_KEYS.webhooks });
    },
  });
}
