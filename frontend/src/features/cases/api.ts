import { apiClient } from "@/lib/api/client";
import { CaseDetail, CaseItem } from "./types";
import { CaseCreateInput, CaseUpdateInput } from "./schemas";

export const casesApi = {
  getCases: async (status?: string): Promise<CaseItem[]> => {
    return apiClient.get<CaseItem[]>("/cases/", { params: { status } });
  },

  getCaseById: async (caseId: string): Promise<CaseDetail> => {
    return apiClient.get<CaseDetail>(`/cases/${caseId}`);
  },

  createCase: async (payload: CaseCreateInput): Promise<CaseDetail> => {
    return apiClient.post<CaseDetail>("/cases/", payload);
  },

  updateCase: async (caseId: string, payload: CaseUpdateInput): Promise<CaseDetail> => {
    return apiClient.put<CaseDetail>(`/cases/${caseId}`, payload);
  },
};
