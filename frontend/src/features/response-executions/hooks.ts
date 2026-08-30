import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { responseExecutionsApi } from "./api";
import { RetryStepInput, RollbackExecutionInput } from "./schemas";

export const EXECUTIONS_KEYS = {
  all: ["response-executions"] as const,
  list: () => [...EXECUTIONS_KEYS.all, "list"] as const,
  detail: (id: string) => [...EXECUTIONS_KEYS.all, "detail", id] as const,
};

export function useResponseExecutions() {
  return useQuery({
    queryKey: EXECUTIONS_KEYS.list(),
    queryFn: responseExecutionsApi.getExecutions,
    refetchInterval: 5000,
  });
}

export function useResponseExecutionDetail(executionId: string) {
  return useQuery({
    queryKey: EXECUTIONS_KEYS.detail(executionId),
    queryFn: () => responseExecutionsApi.getExecutionById(executionId),
    enabled: Boolean(executionId),
    refetchInterval: 4000,
  });
}

export function useRetryExecutionStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ executionId, payload }: { executionId: string; payload: RetryStepInput }) =>
      responseExecutionsApi.retryStep(executionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_KEYS.detail(variables.executionId) });
    },
  });
}

export function useRollbackExecution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ executionId, payload }: { executionId: string; payload: RollbackExecutionInput }) =>
      responseExecutionsApi.rollbackExecution(executionId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_KEYS.detail(variables.executionId) });
    },
  });
}
