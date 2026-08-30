import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { threatIntelligenceApi } from "./api";
import { ThreatFeedCreateInput, ThreatWatchlistCreateInput } from "./schemas";

export const THREAT_INTEL_KEYS = {
  all: ["threat-intelligence"] as const,
  summary: () => [...THREAT_INTEL_KEYS.all, "summary"] as const,
  feeds: () => [...THREAT_INTEL_KEYS.all, "feeds"] as const,
  feed: (id: string) => [...THREAT_INTEL_KEYS.all, "feed", id] as const,
  sources: () => [...THREAT_INTEL_KEYS.all, "sources"] as const,
  iocs: (params?: Record<string, any>) => [...THREAT_INTEL_KEYS.all, "iocs", params] as const,
  ioc: (id: string) => [...THREAT_INTEL_KEYS.all, "ioc", id] as const,
  actors: () => [...THREAT_INTEL_KEYS.all, "actors"] as const,
  actor: (id: string) => [...THREAT_INTEL_KEYS.all, "actor", id] as const,
  campaigns: () => [...THREAT_INTEL_KEYS.all, "campaigns"] as const,
  campaign: (id: string) => [...THREAT_INTEL_KEYS.all, "campaign", id] as const,
  risk: () => [...THREAT_INTEL_KEYS.all, "risk"] as const,
  activity: (period: string) => [...THREAT_INTEL_KEYS.all, "activity", period] as const,
  geography: () => [...THREAT_INTEL_KEYS.all, "geography"] as const,
  watchlists: () => [...THREAT_INTEL_KEYS.all, "watchlists"] as const,
  report: () => [...THREAT_INTEL_KEYS.all, "report"] as const,
  search: (query: string) => [...THREAT_INTEL_KEYS.all, "search", query] as const,
};

export function useThreatSummary() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.summary(),
    queryFn: threatIntelligenceApi.getSummary,
    refetchInterval: 30000,
  });
}

export function useThreatFeeds() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.feeds(),
    queryFn: threatIntelligenceApi.getFeeds,
  });
}

export function useThreatSources() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.sources(),
    queryFn: threatIntelligenceApi.getSources,
  });
}

export function useIOCs(params?: { ioc_type?: string; status?: string; severity?: string }) {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.iocs(params),
    queryFn: () => threatIntelligenceApi.getIOCs(params),
  });
}

export function useIOCDetail(iocId: string) {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.ioc(iocId),
    queryFn: () => threatIntelligenceApi.getIOCById(iocId),
    enabled: Boolean(iocId),
  });
}

export function useThreatActors() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.actors(),
    queryFn: threatIntelligenceApi.getActors,
  });
}

export function useThreatActorDetail(actorId: string) {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.actor(actorId),
    queryFn: () => threatIntelligenceApi.getActorById(actorId),
    enabled: Boolean(actorId),
  });
}

export function useThreatCampaigns() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.campaigns(),
    queryFn: threatIntelligenceApi.getCampaigns,
  });
}

export function useThreatCampaignDetail(campaignId: string) {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.campaign(campaignId),
    queryFn: () => threatIntelligenceApi.getCampaignById(campaignId),
    enabled: Boolean(campaignId),
  });
}

export function useThreatRisk() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.risk(),
    queryFn: threatIntelligenceApi.getRisk,
  });
}

export function useThreatActivity(period = "30d") {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.activity(period),
    queryFn: () => threatIntelligenceApi.getActivity(period),
  });
}

export function useThreatGeography() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.geography(),
    queryFn: threatIntelligenceApi.getGeography,
  });
}

export function useThreatWatchlists() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.watchlists(),
    queryFn: threatIntelligenceApi.getWatchlists,
  });
}

export function useThreatReport() {
  return useQuery({
    queryKey: THREAT_INTEL_KEYS.report(),
    queryFn: threatIntelligenceApi.getReport,
  });
}

export function useCreateThreatFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ThreatFeedCreateInput) => threatIntelligenceApi.createFeed(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREAT_INTEL_KEYS.feeds() });
      queryClient.invalidateQueries({ queryKey: THREAT_INTEL_KEYS.summary() });
    },
  });
}

export function useTestThreatFeed() {
  return useMutation({
    mutationFn: (feedId: string) => threatIntelligenceApi.testFeed(feedId),
  });
}

export function useCreateWatchlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ThreatWatchlistCreateInput) => threatIntelligenceApi.createWatchlist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREAT_INTEL_KEYS.watchlists() });
    },
  });
}
