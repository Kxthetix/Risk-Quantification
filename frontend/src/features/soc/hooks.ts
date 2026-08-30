import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { socApi } from "./api";
import {
  IncidentAssignmentInput,
  IncidentCommunicationInput,
  IncidentNoteInput,
  IncidentReviewInput,
  IncidentTriageInput,
  SOCTaskCreateInput,
} from "./schemas";

export const SOC_KEYS = {
  all: ["soc"] as const,
  dashboard: () => [...SOC_KEYS.all, "dashboard"] as const,
  metrics: () => [...SOC_KEYS.all, "metrics"] as const,
  trends: (period: string) => [...SOC_KEYS.all, "trends", period] as const,
  riskMap: () => [...SOC_KEYS.all, "risk-map"] as const,
  notes: (incidentId: string) => [...SOC_KEYS.all, "notes", incidentId] as const,
  review: (incidentId: string) => [...SOC_KEYS.all, "review", incidentId] as const,
  graph: (incidentId: string) => [...SOC_KEYS.all, "graph", incidentId] as const,
  tasks: () => [...SOC_KEYS.all, "tasks"] as const,
};

export function useSOCDashboard() {
  return useQuery({
    queryKey: SOC_KEYS.dashboard(),
    queryFn: socApi.getDashboard,
    refetchInterval: 10000,
  });
}

export function useSOCMetrics() {
  return useQuery({
    queryKey: SOC_KEYS.metrics(),
    queryFn: socApi.getMetrics,
    refetchInterval: 15000,
  });
}

export function useSOCTrends(period: string = "30d") {
  return useQuery({
    queryKey: SOC_KEYS.trends(period),
    queryFn: () => socApi.getTrends(period),
  });
}

export function useSOCRiskMap() {
  return useQuery({
    queryKey: SOC_KEYS.riskMap(),
    queryFn: socApi.getRiskMap,
  });
}

export function useIncidentNotes(incidentId: string) {
  return useQuery({
    queryKey: SOC_KEYS.notes(incidentId),
    queryFn: () => socApi.getIncidentNotes(incidentId),
    enabled: Boolean(incidentId),
  });
}

export function useIncidentReview(incidentId: string) {
  return useQuery({
    queryKey: SOC_KEYS.review(incidentId),
    queryFn: () => socApi.getIncidentReview(incidentId),
    enabled: Boolean(incidentId),
  });
}

export function useIncidentRelationshipGraph(incidentId: string) {
  return useQuery({
    queryKey: SOC_KEYS.graph(incidentId),
    queryFn: () => socApi.getRelationshipGraph(incidentId),
    enabled: Boolean(incidentId),
  });
}

export function useSOCTasks() {
  return useQuery({
    queryKey: SOC_KEYS.tasks(),
    queryFn: socApi.getTasks,
  });
}

export function useTriageIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentTriageInput }) =>
      socApi.triageIncident(incidentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.all });
    },
  });
}

export function useAssignIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentAssignmentInput }) =>
      socApi.assignIncident(incidentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.all });
    },
  });
}

export function useAddIncidentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentNoteInput }) =>
      socApi.addIncidentNote(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.notes(variables.incidentId) });
    },
  });
}

export function useCreateIncidentReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentReviewInput }) =>
      socApi.createIncidentReview(incidentId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.review(variables.incidentId) });
    },
  });
}

export function useSendIncidentCommunication() {
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: IncidentCommunicationInput }) =>
      socApi.sendIncidentCommunication(incidentId, payload),
  });
}

export function useCreateSOCTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SOCTaskCreateInput) => socApi.createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.tasks() });
    },
  });
}

export function useUpdateSOCTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: { status?: string; owner?: string; priority?: string } }) =>
      socApi.updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SOC_KEYS.tasks() });
    },
  });
}
