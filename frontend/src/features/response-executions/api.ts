import { apiClient } from "@/lib/api/client";
import { ResponseExecution } from "./types";
import { RetryStepInput, RollbackExecutionInput } from "./schemas";

export const responseExecutionsApi = {
  getExecutions: async (): Promise<ResponseExecution[]> => {
    return apiClient.get<ResponseExecution[]>("/response-executions/");
  },

  getExecutionById: async (executionId: string): Promise<ResponseExecution> => {
    return apiClient.get<ResponseExecution>(`/response-executions/${executionId}`);
  },

  retryStep: async (executionId: string, payload: RetryStepInput): Promise<ResponseExecution> => {
    return apiClient.post<ResponseExecution>(`/response-executions/${executionId}/retry`, payload);
  },

  rollbackExecution: async (executionId: string, payload: RollbackExecutionInput): Promise<ResponseExecution> => {
    return apiClient.post<ResponseExecution>(`/response-executions/${executionId}/rollback`, payload);
  },
};
