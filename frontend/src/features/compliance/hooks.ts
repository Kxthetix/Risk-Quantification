import { useQuery } from "@tanstack/react-query";
import { complianceApi } from "./api";

export const complianceKeys = {
  all: ["compliance"] as const,
  summary: () => [...complianceKeys.all, "summary"] as const,
  frameworks: () => [...complianceKeys.all, "frameworks"] as const,
  frameworkDetail: (id: string) => [...complianceKeys.all, "framework", id] as const,
  frameworkControls: (id: string) => [...complianceKeys.all, "framework", id, "controls"] as const,
  controlDetail: (id: string) => [...complianceKeys.all, "control", id] as const,
  assessments: () => [...complianceKeys.all, "assessments"] as const,
  evidence: () => [...complianceKeys.all, "evidence"] as const,
  gaps: () => [...complianceKeys.all, "gaps"] as const,
  gapDetail: (id: string) => [...complianceKeys.all, "gap", id] as const,
  cyberRiskMap: () => [...complianceKeys.all, "cyberRiskMap"] as const,
  remediations: () => [...complianceKeys.all, "remediations"] as const,
  audits: () => [...complianceKeys.all, "audits"] as const,
  trends: () => [...complianceKeys.all, "trends"] as const,
  crossFrameworkMappings: () => [...complianceKeys.all, "crossFrameworkMappings"] as const,
};

export function useComplianceSummary() {
  return useQuery({
    queryKey: complianceKeys.summary(),
    queryFn: complianceApi.getSummary,
  });
}

export function useComplianceFrameworks() {
  return useQuery({
    queryKey: complianceKeys.frameworks(),
    queryFn: complianceApi.getFrameworks,
  });
}

export function useFrameworkDetail(frameworkId: string) {
  return useQuery({
    queryKey: complianceKeys.frameworkDetail(frameworkId),
    queryFn: () => complianceApi.getFrameworkDetail(frameworkId),
    enabled: Boolean(frameworkId),
  });
}

export function useFrameworkControls(frameworkId: string) {
  return useQuery({
    queryKey: complianceKeys.frameworkControls(frameworkId),
    queryFn: () => complianceApi.getFrameworkControls(frameworkId),
    enabled: Boolean(frameworkId),
  });
}

export function useControlDetail(controlId: string) {
  return useQuery({
    queryKey: complianceKeys.controlDetail(controlId),
    queryFn: () => complianceApi.getControlDetail(controlId),
    enabled: Boolean(controlId),
  });
}

export function useComplianceAssessments() {
  return useQuery({
    queryKey: complianceKeys.assessments(),
    queryFn: complianceApi.getAssessments,
  });
}

export function useComplianceEvidence() {
  return useQuery({
    queryKey: complianceKeys.evidence(),
    queryFn: complianceApi.getEvidence,
  });
}

export function useComplianceGaps() {
  return useQuery({
    queryKey: complianceKeys.gaps(),
    queryFn: complianceApi.getGaps,
  });
}

export function useComplianceGapDetail(gapId: string) {
  return useQuery({
    queryKey: complianceKeys.gapDetail(gapId),
    queryFn: () => complianceApi.getGapDetail(gapId),
    enabled: Boolean(gapId),
  });
}

export function useComplianceCyberRiskMap() {
  return useQuery({
    queryKey: complianceKeys.cyberRiskMap(),
    queryFn: complianceApi.getCyberRiskMap,
  });
}

export function useComplianceRemediations() {
  return useQuery({
    queryKey: complianceKeys.remediations(),
    queryFn: complianceApi.getRemediations,
  });
}

export function useComplianceAudits() {
  return useQuery({
    queryKey: complianceKeys.audits(),
    queryFn: complianceApi.getAudits,
  });
}

export function useComplianceTrends() {
  return useQuery({
    queryKey: complianceKeys.trends(),
    queryFn: complianceApi.getTrends,
  });
}

export function useCrossFrameworkMappings() {
  return useQuery({
    queryKey: complianceKeys.crossFrameworkMappings(),
    queryFn: complianceApi.getCrossFrameworkMappings,
  });
}
