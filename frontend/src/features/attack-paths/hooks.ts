import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attackPathApi } from "./api";
import { AttackPathFilterParams } from "./types";
import { AttackPathAnalyzeForm, ThreatScenarioCreateForm } from "./schemas";

export const ATTACK_PATH_QUERY_KEYS = {
  summary: ["attack-paths", "summary"] as const,
  list: (params?: AttackPathFilterParams) => ["attack-paths", "list", params] as const,
  top: (limit?: number, riskLevel?: string) => ["attack-paths", "top", limit, riskLevel] as const,
  detail: (id: string) => ["attack-paths", "detail", id] as const,
  assetPaths: (assetId: string) => ["attack-paths", "asset", assetId] as const,
  graph: ["attack-paths", "graph"] as const,
  chokepoints: ["attack-paths", "chokepoints"] as const,
  mitreTechniques: ["attack-paths", "mitre-techniques"] as const,
  mitreTechnique: (id: string) => ["attack-paths", "mitre-technique", id] as const,
  entryPoints: ["attack-paths", "entry-points"] as const,
  crownJewels: ["attack-paths", "crown-jewels"] as const,
  threatScenarios: (status?: string) => ["threat-scenarios", "list", status] as const,
  threatScenario: (id: string) => ["threat-scenarios", "detail", id] as const,
  threatCompare: (id: string) => ["threat-scenarios", "compare", id] as const,
};

export function useAttackPathSummary() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.summary,
    queryFn: attackPathApi.getAttackPathSummary,
    staleTime: 30 * 1000,
  });
}

export function useAttackPaths(params?: AttackPathFilterParams) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.list(params),
    queryFn: () => attackPathApi.getAttackPaths(params),
    staleTime: 30 * 1000,
  });
}

export function useTopAttackPaths(limit: number = 10, riskLevel?: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.top(limit, riskLevel),
    queryFn: () => attackPathApi.getTopAttackPaths(limit, riskLevel),
    staleTime: 30 * 1000,
  });
}

export function useAttackPath(pathId: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.detail(pathId),
    queryFn: () => attackPathApi.getAttackPath(pathId),
    enabled: !!pathId,
  });
}

export function useAttackGraph() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.graph,
    queryFn: attackPathApi.getAttackGraph,
    staleTime: 60 * 1000,
  });
}

export function useChokepoints() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.chokepoints,
    queryFn: attackPathApi.getChokepoints,
    staleTime: 60 * 1000,
  });
}

export function useMitreTechniques() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.mitreTechniques,
    queryFn: attackPathApi.getMitreTechniques,
    staleTime: 60 * 1000,
  });
}

export function useMitreTechnique(techniqueId: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.mitreTechnique(techniqueId),
    queryFn: () => attackPathApi.getMitreTechnique(techniqueId),
    enabled: !!techniqueId,
  });
}

export function useEntryPoints() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.entryPoints,
    queryFn: attackPathApi.getEntryPoints,
    staleTime: 60 * 1000,
  });
}

export function useCrownJewels() {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.crownJewels,
    queryFn: attackPathApi.getCrownJewels,
    staleTime: 60 * 1000,
  });
}

export function useThreatScenarios(status?: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.threatScenarios(status),
    queryFn: () => attackPathApi.getThreatScenarios(status),
    staleTime: 30 * 1000,
  });
}

export function useThreatScenario(scenarioId: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.threatScenario(scenarioId),
    queryFn: () => attackPathApi.getThreatScenario(scenarioId),
    enabled: !!scenarioId,
  });
}

export function useThreatScenarioCompare(scenarioId: string) {
  return useQuery({
    queryKey: ATTACK_PATH_QUERY_KEYS.threatCompare(scenarioId),
    queryFn: () => attackPathApi.compareThreatScenarios(scenarioId),
    enabled: !!scenarioId,
  });
}

export function useStartAttackPathAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttackPathAnalyzeForm) => attackPathApi.startAttackPathAnalysis(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attack-paths"] });
    },
  });
}

export function useCreateThreatScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ThreatScenarioCreateForm) => attackPathApi.createThreatScenario(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat-scenarios"] });
    },
  });
}

export function useGenerateThreatScenarios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetAssetId?: string) => attackPathApi.generateThreatScenarios(targetAssetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat-scenarios"] });
    },
  });
}

export function useDeleteThreatScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => attackPathApi.deleteThreatScenario(scenarioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threat-scenarios"] });
    },
  });
}
