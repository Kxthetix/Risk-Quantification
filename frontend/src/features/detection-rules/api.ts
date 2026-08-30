import { apiClient } from "@/lib/api/client";
import { DetectionRule, DetectionRuleDetail, DetectionRuleTestResult } from "./types";
import { DetectionRuleCreateInput, DetectionRuleTestInput } from "./schemas";

export const detectionRulesApi = {
  getRules: async (params?: { severity?: string; status?: string; source?: string }): Promise<DetectionRule[]> => {
    return apiClient.get<DetectionRule[]>("/detection-rules/", { params });
  },

  getRuleById: async (ruleId: string): Promise<DetectionRuleDetail> => {
    return apiClient.get<DetectionRuleDetail>(`/detection-rules/${ruleId}`);
  },

  testRule: async (payload: DetectionRuleTestInput): Promise<DetectionRuleTestResult> => {
    return apiClient.post<DetectionRuleTestResult>("/detection-rules/test", payload);
  },
};
