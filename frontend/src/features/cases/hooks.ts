import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { casesApi } from "./api";
import { CaseCreateInput, CaseUpdateInput } from "./schemas";

export const CASES_KEYS = {
  all: ["cases"] as const,
  list: (status?: string) => [...CASES_KEYS.all, "list", status] as const,
  detail: (id: string) => [...CASES_KEYS.all, "detail", id] as const,
};

export function useCases(status?: string) {
  return useQuery({
    queryKey: CASES_KEYS.list(status),
    queryFn: () => casesApi.getCases(status),
  });
}

export function useCaseDetail(caseId: string) {
  return useQuery({
    queryKey: CASES_KEYS.detail(caseId),
    queryFn: () => casesApi.getCaseById(caseId),
    enabled: Boolean(caseId),
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CaseCreateInput) => casesApi.createCase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASES_KEYS.all });
    },
  });
}

export function useUpdateCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ caseId, payload }: { caseId: string; payload: CaseUpdateInput }) =>
      casesApi.updateCase(caseId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CASES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CASES_KEYS.detail(variables.caseId) });
    },
  });
}
