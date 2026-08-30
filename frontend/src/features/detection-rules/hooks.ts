import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { detectionRulesApi } from "./api";
import { DetectionRuleTestInput } from "./schemas";

export const DETECTION_RULES_KEYS = {
  all: ["detection-rules"] as const,
  list: (params?: Record<string, any>) => [...DETECTION_RULES_KEYS.all, "list", params] as const,
  detail: (id: string) => [...DETECTION_RULES_KEYS.all, "detail", id] as const,
};

export function useDetectionRules(params?: { severity?: string; status?: string; source?: string }) {
  return useQuery({
    queryKey: DETECTION_RULES_KEYS.list(params),
    queryFn: () => detectionRulesApi.getRules(params),
  });
}

export function useDetectionRuleDetail(ruleId: string) {
  return useQuery({
    queryKey: DETECTION_RULES_KEYS.detail(ruleId),
    queryFn: () => detectionRulesApi.getRuleById(ruleId),
    enabled: Boolean(ruleId),
  });
}

export function useTestDetectionRule() {
  return useMutation({
    mutationFn: (payload: DetectionRuleTestInput) => detectionRulesApi.testRule(payload),
  });
}
