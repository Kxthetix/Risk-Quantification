import { apiClient } from "@/lib/api/client";
import {
  FinancialProfile,
  FinancialAssessment,
  FinancialDistribution,
  LossBreakdown,
  TopLossFinding,
  OrganizationFinancialSummary,
  SimulationJob,
  WhatIfResponse,
  ControlScenarioResponse,
} from "@/types/financial";
import {
  ThreatScenarioItem,
  ScenarioCreatePayload,
  WhatIfPayload,
  ControlRoiPayload,
} from "./types";

export const riskQuantificationApi = {
  getSummary: async (): Promise<OrganizationFinancialSummary> => {
    return apiClient.get<OrganizationFinancialSummary>("/financial/organization/summary");
  },

  getTopLosses: async (limit: number = 10): Promise<TopLossFinding[]> => {
    return apiClient.get<TopLossFinding[]>("/financial/organization/top-losses", {
      params: { limit },
    });
  },

  getProfile: async (): Promise<FinancialProfile> => {
    return apiClient.get<FinancialProfile>("/financial/profile");
  },

  updateProfile: async (payload: Partial<FinancialProfile>): Promise<FinancialProfile> => {
    return apiClient.put<FinancialProfile>("/financial/profile", payload);
  },

  calculate: async (payload: {
    asset_vulnerability_id: string;
    simulation_count?: number;
    random_seed?: number;
    synchronous?: boolean;
    overrides?: Record<string, any>;
  }): Promise<{ financial_assessment_id: string; job_id: string; status: string }> => {
    return apiClient.post<{ financial_assessment_id: string; job_id: string; status: string }>(
      "/financial/calculate",
      payload
    );
  },

  getAssessment: async (assessmentId: string): Promise<FinancialAssessment> => {
    return apiClient.get<FinancialAssessment>(`/financial/${assessmentId}`);
  },

  getBreakdown: async (assessmentId: string): Promise<LossBreakdown> => {
    return apiClient.get<LossBreakdown>(`/financial/${assessmentId}/breakdown`);
  },

  getDistribution: async (assessmentId: string): Promise<FinancialDistribution> => {
    return apiClient.get<FinancialDistribution>(`/financial/${assessmentId}/distribution`);
  },

  runWhatIf: async (payload: WhatIfPayload): Promise<WhatIfResponse> => {
    return apiClient.post<WhatIfResponse>("/financial/what-if", payload);
  },

  runControlScenario: async (payload: ControlRoiPayload): Promise<ControlScenarioResponse> => {
    return apiClient.post<ControlScenarioResponse>("/financial/control-scenario", {
      asset_vulnerability_id: payload.asset_vulnerability_id,
      control: payload.control_name,
      implementation_cost: payload.implementation_cost,
      risk_reduction: payload.risk_reduction_percentage,
    });
  },

  getSimulationStatus: async (jobId: string): Promise<SimulationJob> => {
    return apiClient.get<SimulationJob>(`/simulation/${jobId}`);
  },

  getThreatScenarios: async (status?: string): Promise<ThreatScenarioItem[]> => {
    return apiClient.get<ThreatScenarioItem[]>("/threat-scenarios", {
      params: { status },
    });
  },

  getThreatScenario: async (id: string): Promise<ThreatScenarioItem> => {
    return apiClient.get<ThreatScenarioItem>(`/threat-scenarios/${id}`);
  },

  createThreatScenario: async (payload: ScenarioCreatePayload): Promise<ThreatScenarioItem> => {
    return apiClient.post<ThreatScenarioItem>("/threat-scenarios", payload);
  },

  generateThreatScenarios: async (targetAssetId?: string): Promise<ThreatScenarioItem[]> => {
    return apiClient.post<ThreatScenarioItem[]>("/threat-scenarios/generate", {
      target_asset_id: targetAssetId,
    });
  },
};
