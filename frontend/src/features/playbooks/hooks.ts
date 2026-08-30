import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playbooksApi } from "./api";
import { PlaybookCreateInput, PlaybookExecutionInput } from "./schemas";

export const PLAYBOOKS_KEYS = {
  all: ["playbooks"] as const,
  list: (category?: string) => [...PLAYBOOKS_KEYS.all, "list", category] as const,
  detail: (id: string) => [...PLAYBOOKS_KEYS.all, "detail", id] as const,
};

export function usePlaybooks(category?: string) {
  return useQuery({
    queryKey: PLAYBOOKS_KEYS.list(category),
    queryFn: () => playbooksApi.getPlaybooks(category ? { category } : undefined),
  });
}

export function usePlaybookDetail(playbookId: string) {
  return useQuery({
    queryKey: PLAYBOOKS_KEYS.detail(playbookId),
    queryFn: () => playbooksApi.getPlaybookById(playbookId),
    enabled: Boolean(playbookId),
  });
}

export function useCreatePlaybook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlaybookCreateInput) => playbooksApi.createPlaybook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAYBOOKS_KEYS.all });
    },
  });
}

export function useExecutePlaybook() {
  return useMutation({
    mutationFn: ({ playbookId, payload }: { playbookId: string; payload: PlaybookExecutionInput }) =>
      playbooksApi.executePlaybook(playbookId, payload),
  });
}
