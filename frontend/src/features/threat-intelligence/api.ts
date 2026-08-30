import { apiClient } from "@/lib/api/client";
import {
  IOCDetail,
  IOCItem,
  ThreatActivity,
  ThreatActor,
  ThreatActorDetail,
  ThreatCampaign,
  ThreatCampaignDetail,
  ThreatFeed,
  ThreatFeedHealth,
  ThreatGeographyItem,
  ThreatGlobalSearch,
  ThreatLandscapeReport,
  ThreatRisk,
  ThreatSource,
  ThreatSummary,
  ThreatWatchlist,
} from "./types";
import { IOCUpdateInput, ThreatFeedCreateInput, ThreatWatchlistCreateInput } from "./schemas";

export const threatIntelligenceApi = {
  getSummary: async (): Promise<ThreatSummary> => {
    return apiClient.get<ThreatSummary>("/threat-intelligence/summary");
  },

  getFeeds: async (): Promise<ThreatFeed[]> => {
    return apiClient.get<ThreatFeed[]>("/threat-intelligence/feeds");
  },

  getFeedById: async (feedId: string): Promise<ThreatFeed> => {
    return apiClient.get<ThreatFeed>(`/threat-intelligence/feeds/${feedId}`);
  },

  createFeed: async (payload: ThreatFeedCreateInput): Promise<ThreatFeed> => {
    return apiClient.post<ThreatFeed>("/threat-intelligence/feeds", payload);
  },

  testFeed: async (feedId: string): Promise<ThreatFeedHealth> => {
    return apiClient.post<ThreatFeedHealth>(`/threat-intelligence/feeds/${feedId}/test`);
  },

  getSources: async (): Promise<ThreatSource[]> => {
    return apiClient.get<ThreatSource[]>("/threat-intelligence/sources");
  },

  getIOCs: async (params?: { ioc_type?: string; status?: string; severity?: string }): Promise<IOCItem[]> => {
    return apiClient.get<IOCItem[]>("/threat-intelligence/iocs", { params });
  },

  getIOCById: async (iocId: string): Promise<IOCDetail> => {
    return apiClient.get<IOCDetail>(`/threat-intelligence/iocs/${iocId}`);
  },

  getActors: async (): Promise<ThreatActor[]> => {
    return apiClient.get<ThreatActor[]>("/threat-intelligence/actors");
  },

  getActorById: async (actorId: string): Promise<ThreatActorDetail> => {
    return apiClient.get<ThreatActorDetail>(`/threat-intelligence/actors/${actorId}`);
  },

  getCampaigns: async (): Promise<ThreatCampaign[]> => {
    return apiClient.get<ThreatCampaign[]>("/threat-intelligence/campaigns");
  },

  getCampaignById: async (campaignId: string): Promise<ThreatCampaignDetail> => {
    return apiClient.get<ThreatCampaignDetail>(`/threat-intelligence/campaigns/${campaignId}`);
  },

  getRisk: async (): Promise<ThreatRisk> => {
    return apiClient.get<ThreatRisk>("/threat-intelligence/risk");
  },

  getActivity: async (period = "30d"): Promise<ThreatActivity> => {
    return apiClient.get<ThreatActivity>("/threat-intelligence/activity", { params: { period } });
  },

  getGeography: async (): Promise<ThreatGeographyItem[]> => {
    return apiClient.get<ThreatGeographyItem[]>("/threat-intelligence/geography");
  },

  getWatchlists: async (): Promise<ThreatWatchlist[]> => {
    return apiClient.get<ThreatWatchlist[]>("/threat-intelligence/watchlists");
  },

  createWatchlist: async (payload: ThreatWatchlistCreateInput): Promise<ThreatWatchlist> => {
    return apiClient.post<ThreatWatchlist>("/threat-intelligence/watchlists", payload);
  },

  getReport: async (): Promise<ThreatLandscapeReport> => {
    return apiClient.get<ThreatLandscapeReport>("/threat-intelligence/reports");
  },

  globalSearch: async (query: string): Promise<ThreatGlobalSearch> => {
    return apiClient.get<ThreatGlobalSearch>("/threat-intelligence/search", { params: { query } });
  },
};
