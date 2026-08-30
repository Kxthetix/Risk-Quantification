import { apiClient } from "@/lib/api/client";
import { ApprovalDetail, ApprovalItem } from "./types";
import { ApprovalActionInput } from "./schemas";

export const approvalsApi = {
  getApprovals: async (status?: string): Promise<ApprovalItem[]> => {
    return apiClient.get<ApprovalItem[]>("/approvals/", { params: { status } });
  },

  getApprovalById: async (approvalId: string): Promise<ApprovalDetail> => {
    return apiClient.get<ApprovalDetail>(`/approvals/${approvalId}`);
  },

  processApproval: async (approvalId: string, payload: ApprovalActionInput): Promise<ApprovalDetail> => {
    return apiClient.post<ApprovalDetail>(`/approvals/${approvalId}/action`, payload);
  },
};
