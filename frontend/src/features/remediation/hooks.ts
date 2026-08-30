import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { remediationApi } from "./api";
import {
  RemediationCreateInput,
  RemediationPriorityLevel,
  RemediationStatus,
  RemediationUpdateInput,
  RemediationVerifyInput,
  RiskAcceptanceInput,
} from "./types";

export const REMEDIATIONS_QUERY_KEY = ["remediations"] as const;

export function useRemediations(params?: {
  status?: RemediationStatus;
  priority_level?: RemediationPriorityLevel;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...REMEDIATIONS_QUERY_KEY, params],
    queryFn: () => remediationApi.getRemediations(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTopRemediations(params?: {
  limit?: number;
  priority_level?: RemediationPriorityLevel;
  asset_id?: string;
  max_cost?: number;
}) {
  return useQuery({
    queryKey: [...REMEDIATIONS_QUERY_KEY, "top", params],
    queryFn: () => remediationApi.getTopRemediations(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRemediation(remediationId: string) {
  return useQuery({
    queryKey: [...REMEDIATIONS_QUERY_KEY, "detail", remediationId],
    queryFn: () => remediationApi.getRemediation(remediationId),
    enabled: Boolean(remediationId),
  });
}

export function useCreateRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemediationCreateInput) => remediationApi.createRemediation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
    },
  });
}

export function useUpdateRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      remediationId,
      payload,
    }: {
      remediationId: string;
      payload: RemediationUpdateInput;
    }) => remediationApi.updateRemediation(remediationId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...REMEDIATIONS_QUERY_KEY, "detail", variables.remediationId],
      });
    },
  });
}

export function useDeleteRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (remediationId: string) => remediationApi.deleteRemediation(remediationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
    },
  });
}

export function useSimulateRemediation() {
  return useMutation({
    mutationFn: (remediationId: string) => remediationApi.simulateRemediation(remediationId),
  });
}

export function useCompleteRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (remediationId: string) => remediationApi.completeRemediation(remediationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
    },
  });
}

export function useVerifyRemediation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      remediationId,
      payload,
    }: {
      remediationId: string;
      payload: RemediationVerifyInput;
    }) => remediationApi.verifyRemediation(remediationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
    },
  });
}

export function useAcceptRisk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      remediationId,
      payload,
    }: {
      remediationId: string;
      payload: RiskAcceptanceInput;
    }) => remediationApi.acceptRisk(remediationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMEDIATIONS_QUERY_KEY });
    },
  });
}
