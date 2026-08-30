import { apiClient } from "@/lib/api/client";
import {
  AttackGraphData,
  AttackPath,
  AttackPathFilterParams,
  AttackPathListResponse,
  AttackPathSummary,
  ChokepointItem,
  CrownJewelItem,
  EntryPointItem,
  MitreTechnique,
  ThreatScenario,
  ThreatScenarioCompareResponse,
} from "./types";
import { AttackPathAnalyzeForm, ThreatScenarioCreateForm } from "./schemas";

export const attackPathApi = {
  getAttackPathSummary: async (): Promise<AttackPathSummary> => {
    return apiClient.get<AttackPathSummary>("/attack-paths/summary");
  },

  getAttackPaths: async (params?: AttackPathFilterParams): Promise<AttackPathListResponse> => {
    return apiClient.get<AttackPathListResponse>("/attack-paths", { params });
  },

  getTopAttackPaths: async (limit: number = 10, riskLevel?: string): Promise<AttackPath[]> => {
    return apiClient.get<AttackPath[]>("/attack-paths/top", {
      params: { limit, risk_level: riskLevel },
    });
  },

  getAttackPath: async (pathId: string): Promise<AttackPath> => {
    return apiClient.get<AttackPath>(`/attack-paths/${pathId}`);
  },

  getAssetAttackPaths: async (assetId: string): Promise<any> => {
    return apiClient.get<any>(`/assets/${assetId}/attack-paths`);
  },

  getAttackGraph: async (): Promise<AttackGraphData> => {
    return apiClient.get<AttackGraphData>("/attack-graph");
  },

  getChokepoints: async (): Promise<ChokepointItem[]> => {
    return apiClient.get<ChokepointItem[]>("/attack-paths/chokepoints");
  },

  getMitreTechniques: async (): Promise<MitreTechnique[]> => {
    return apiClient.get<MitreTechnique[]>("/attack-paths/mitre-techniques");
  },

  getMitreTechnique: async (techniqueId: string): Promise<any> => {
    return apiClient.get<any>(`/attack-paths/mitre-techniques/${techniqueId}`);
  },

  getEntryPoints: async (): Promise<EntryPointItem[]> => {
    return apiClient.get<EntryPointItem[]>("/attack-paths/entry-points");
  },

  getCrownJewels: async (): Promise<CrownJewelItem[]> => {
    return apiClient.get<CrownJewelItem[]>("/attack-paths/crown-jewels");
  },

  startAttackPathAnalysis: async (payload: AttackPathAnalyzeForm): Promise<any> => {
    return apiClient.post<any>("/attack-paths/analyze", payload);
  },

  getThreatScenarios: async (status?: string): Promise<ThreatScenario[]> => {
    return apiClient.get<ThreatScenario[]>("/threat-scenarios", {
      params: { status },
    });
  },

  getThreatScenario: async (scenarioId: string): Promise<ThreatScenario> => {
    return apiClient.get<ThreatScenario>(`/threat-scenarios/${scenarioId}`);
  },

  createThreatScenario: async (payload: ThreatScenarioCreateForm): Promise<ThreatScenario> => {
    return apiClient.post<ThreatScenario>("/threat-scenarios", payload);
  },

  updateThreatScenario: async (
    scenarioId: string,
    payload: Partial<ThreatScenarioCreateForm>
  ): Promise<ThreatScenario> => {
    return apiClient.put<ThreatScenario>(`/threat-scenarios/${scenarioId}`, payload);
  },

  deleteThreatScenario: async (scenarioId: string): Promise<void> => {
    return apiClient.delete<void>(`/threat-scenarios/${scenarioId}`);
  },

  generateThreatScenarios: async (targetAssetId?: string): Promise<ThreatScenario[]> => {
    return apiClient.post<ThreatScenario[]>("/threat-scenarios/generate", {
      target_asset_id: targetAssetId || null,
      generate_templates: true,
      generate_from_paths: true,
    });
  },

  compareThreatScenarios: async (scenarioId: string): Promise<ThreatScenarioCompareResponse> => {
    return apiClient.get<ThreatScenarioCompareResponse>(`/threat-scenarios/${scenarioId}/compare`);
  },
};
