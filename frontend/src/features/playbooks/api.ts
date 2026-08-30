import { apiClient } from "@/lib/api/client";
import { PlaybookDetail, PlaybookExecution, PlaybookItem } from "./types";
import { PlaybookCreateInput, PlaybookExecutionInput } from "./schemas";

export const playbooksApi = {
  getPlaybooks: async (params?: { category?: string }): Promise<PlaybookItem[]> => {
    return apiClient.get<PlaybookItem[]>("/playbooks/", { params });
  },

  getPlaybookById: async (playbookId: string): Promise<PlaybookDetail> => {
    return apiClient.get<PlaybookDetail>(`/playbooks/${playbookId}`);
  },

  createPlaybook: async (payload: PlaybookCreateInput): Promise<PlaybookDetail> => {
    return apiClient.post<PlaybookDetail>("/playbooks/", payload);
  },

  executePlaybook: async (playbookId: string, payload: PlaybookExecutionInput): Promise<PlaybookExecution> => {
    return apiClient.post<PlaybookExecution>(`/playbooks/${playbookId}/execute`, payload);
  },
};
