import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approvalsApi } from "./api";
import { ApprovalActionInput } from "./schemas";

export const APPROVALS_KEYS = {
  all: ["approvals"] as const,
  list: (status?: string) => [...APPROVALS_KEYS.all, "list", status] as const,
  detail: (id: string) => [...APPROVALS_KEYS.all, "detail", id] as const,
};

export function useApprovals(status?: string) {
  return useQuery({
    queryKey: APPROVALS_KEYS.list(status),
    queryFn: () => approvalsApi.getApprovals(status),
    refetchInterval: 10000,
  });
}

export function useApprovalDetail(approvalId: string) {
  return useQuery({
    queryKey: APPROVALS_KEYS.detail(approvalId),
    queryFn: () => approvalsApi.getApprovalById(approvalId),
    enabled: Boolean(approvalId),
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalId, payload }: { approvalId: string; payload: ApprovalActionInput }) =>
      approvalsApi.processApproval(approvalId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: APPROVALS_KEYS.detail(variables.approvalId) });
    },
  });
}
