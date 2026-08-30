import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incidentsApi } from "./api";
import {
  IncidentActionInput,
  IncidentCommentInput,
  IncidentCreateInput,
  IncidentTaskInput,
  IncidentUpdateInput,
} from "./schemas";

export const INCIDENTS_KEYS = {
  all: ["incidents-management"] as const,
  summary: () => [...INCIDENTS_KEYS.all, "summary"] as const,
  list: (params?: Record<string, any>) => [...INCIDENTS_KEYS.all, "list", params] as const,
  detail: (id: string) => [...INCIDENTS_KEYS.all, "detail", id] as const,
};

export function useIncidentsSummary() {
  return useQuery({
    queryKey: INCIDENTS_KEYS.summary(),
    queryFn: incidentsApi.getSummary,
    refetchInterval: 15000,
  });
}

export function useIncidents(params?: { status?: string; severity?: string; owner?: string }) {
  return useQuery({
    queryKey: INCIDENTS_KEYS.list(params),
    queryFn: () => incidentsApi.getIncidents(params),
    refetchInterval: 10000,
  });
}

export function useIncidentDetail(incidentId: string) {
  return useQuery({
    queryKey: INCIDENTS_KEYS.detail(incidentId),
    queryFn: () => incidentsApi.getIncidentById(incidentId),
    enabled: Boolean(incidentId),
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: IncidentCreateInput) => incidentsApi.createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.all });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentUpdateInput }) =>
      incidentsApi.updateIncident(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.detail(variables.incidentId) });
    },
  });
}

export function useAddIncidentComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentCommentInput }) =>
      incidentsApi.addComment(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.detail(variables.incidentId) });
    },
  });
}

export function useAddIncidentTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentTaskInput }) =>
      incidentsApi.addTask(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.detail(variables.incidentId) });
    },
  });
}

export function useExecuteIncidentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentActionInput }) =>
      incidentsApi.executeAction(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.detail(variables.incidentId) });
    },
  });
}
