import { apiClient } from "@/lib/api/client";
import {
  AssessmentItem,
  ComplianceAuditItem,
  ComplianceCyberRiskMapResponse,
  ComplianceGapDetail,
  ComplianceGapItem,
  ComplianceRemediationItem,
  ComplianceSummary,
  ComplianceTrendPoint,
  ControlDetail,
  CrossFrameworkMappingItem,
  EvidenceItem,
  FrameworkControlItem,
  FrameworkDetail,
  FrameworkItem,
} from "./types";

export const complianceApi = {
  getSummary: async (): Promise<ComplianceSummary> => {
    return apiClient.get<ComplianceSummary>("/compliance/summary");
  },

  getFrameworks: async (): Promise<FrameworkItem[]> => {
    return apiClient.get<FrameworkItem[]>("/compliance/frameworks");
  },

  getFrameworkDetail: async (frameworkId: string): Promise<FrameworkDetail> => {
    return apiClient.get<FrameworkDetail>(`/compliance/frameworks/${frameworkId}`);
  },

  getFrameworkControls: async (frameworkId: string): Promise<FrameworkControlItem[]> => {
    return apiClient.get<FrameworkControlItem[]>(`/compliance/frameworks/${frameworkId}/controls`);
  },

  getControlDetail: async (controlId: string): Promise<ControlDetail> => {
    return apiClient.get<ControlDetail>(`/compliance/controls/${controlId}`);
  },

  getAssessments: async (): Promise<AssessmentItem[]> => {
    return apiClient.get<AssessmentItem[]>("/compliance/assessments");
  },

  getEvidence: async (): Promise<EvidenceItem[]> => {
    return apiClient.get<EvidenceItem[]>("/compliance/evidence");
  },

  getGaps: async (): Promise<ComplianceGapItem[]> => {
    return apiClient.get<ComplianceGapItem[]>("/compliance/gaps");
  },

  getGapDetail: async (gapId: string): Promise<ComplianceGapDetail> => {
    return apiClient.get<ComplianceGapDetail>(`/compliance/gaps/${gapId}`);
  },

  getCyberRiskMap: async (): Promise<ComplianceCyberRiskMapResponse> => {
    return apiClient.get<ComplianceCyberRiskMapResponse>("/compliance/risk-map");
  },

  getRemediations: async (): Promise<ComplianceRemediationItem[]> => {
    return apiClient.get<ComplianceRemediationItem[]>("/compliance/remediations");
  },

  getAudits: async (): Promise<ComplianceAuditItem[]> => {
    return apiClient.get<ComplianceAuditItem[]>("/compliance/audits");
  },

  getTrends: async (): Promise<ComplianceTrendPoint[]> => {
    return apiClient.get<ComplianceTrendPoint[]>("/compliance/trends");
  },

  getCrossFrameworkMappings: async (): Promise<CrossFrameworkMappingItem[]> => {
    return apiClient.get<CrossFrameworkMappingItem[]>("/compliance/cross-framework-mappings");
  },
};
