import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "./api";
import { AlertAssignInput, AlertFalsePositiveInput, AlertResolveInput } from "./schemas";

export const ALERTS_KEYS = {
  all: ["alerts-management"] as const,
  summary: () => [...ALERTS_KEYS.all, "summary"] as const,
  list: (params?: Record<string, any>) => [...ALERTS_KEYS.all, "list", params] as const,
  detail: (id: string) => [...ALERTS_KEYS.all, "detail", id] as const,
  correlations: () => [...ALERTS_KEYS.all, "correlations"] as const,
};

export function useAlertsSummary() {
  return useQuery({
    queryKey: ALERTS_KEYS.summary(),
    queryFn: alertsApi.getSummary,
    refetchInterval: 15000,
  });
}

export function useAlerts(params?: { severity?: string; status?: string; asset_id?: string }) {
  return useQuery({
    queryKey: ALERTS_KEYS.list(params),
    queryFn: () => alertsApi.getAlerts(params),
    refetchInterval: 10000,
  });
}

export function useAlertDetail(alertId: string) {
  return useQuery({
    queryKey: ALERTS_KEYS.detail(alertId),
    queryFn: () => alertsApi.getAlertById(alertId),
    enabled: Boolean(alertId),
  });
}

export function useAlertCorrelations() {
  return useQuery({
    queryKey: ALERTS_KEYS.correlations(),
    queryFn: alertsApi.getCorrelations,
  });
}

export function useAssignAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, payload }: { alertId: string; payload: AlertAssignInput }) =>
      alertsApi.assignAlert(alertId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.detail(variables.alertId) });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, payload }: { alertId: string; payload: AlertResolveInput }) =>
      alertsApi.resolveAlert(alertId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.detail(variables.alertId) });
    },
  });
}

export function useMarkAlertFalsePositive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, payload }: { alertId: string; payload: AlertFalsePositiveInput }) =>
      alertsApi.markFalsePositive(alertId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.detail(variables.alertId) });
    },
  });
}
