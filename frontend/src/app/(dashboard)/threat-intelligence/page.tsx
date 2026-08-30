"use client";

import React, { useState } from "react";
import {
  ThreatSummaryCards,
  ThreatFeedsTable,
  ThreatFeedModal,
  IOCTable,
  ThreatActorsTable,
  ThreatCampaignsTable,
  ThreatRiskDashboard,
  ThreatWatchlistsTable,
  ThreatReportModal,
  ThreatSearchModal,
  useThreatSummary,
  useThreatFeeds,
  useIOCs,
  useThreatActors,
  useThreatCampaigns,
  useThreatRisk,
  useThreatActivity,
  useThreatGeography,
  useThreatWatchlists,
} from "@/features/threat-intelligence";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Radio, RefreshCw, FileText, Search, Plus, ListChecks } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { THREAT_INTEL_KEYS } from "@/features/threat-intelligence";

export default function ThreatIntelligencePage() {
  const queryClient = useQueryClient();
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const { data: summary, isLoading: isSummaryLoading, isRefetching } = useThreatSummary();
  const { data: feeds = [], isLoading: isFeedsLoading } = useThreatFeeds();
  const { data: iocs = [], isLoading: isIocsLoading } = useIOCs();
  const { data: actors = [], isLoading: isActorsLoading } = useThreatActors();
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useThreatCampaigns();
  const { data: risk, isLoading: isRiskLoading } = useThreatRisk();
  const { data: activity, isLoading: isActivityLoading } = useThreatActivity("30d");
  const { data: geography = [], isLoading: isGeographyLoading } = useThreatGeography();
  const { data: watchlists = [], isLoading: isWatchlistsLoading } = useThreatWatchlists();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: THREAT_INTEL_KEYS.all });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header & Strategic Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-400">
              <Radio className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Threat Intelligence & Adversary Tracking
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative continuous ingestion of global threat feeds, adversary campaigns, and IOC correlations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchModalOpen(true)}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 h-9"
          >
            <Search className="w-4 h-4 text-indigo-400" />
            Global Intel Search
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 h-9"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            Landscape Briefing
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setFeedModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            Add Feed
          </Button>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <ThreatSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Multi-Tab Module Navigator */}
      <Tabs defaultValue="iocs" className="space-y-6">
        <TabsList className="bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <TabsTrigger value="iocs" className="text-xs">
            Indicators of Compromise ({iocs.length})
          </TabsTrigger>
          <TabsTrigger value="actors" className="text-xs">
            Adversary Profiles ({actors.length})
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs">
            Active Campaigns ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">
            Threat Exposure & Geography
          </TabsTrigger>
          <TabsTrigger value="feeds" className="text-xs">
            Ingestion Feeds ({feeds.length})
          </TabsTrigger>
          <TabsTrigger value="watchlists" className="text-xs">
            Watchlists ({watchlists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="iocs" className="space-y-4">
          <IOCTable iocs={iocs} isLoading={isIocsLoading} />
        </TabsContent>

        <TabsContent value="actors" className="space-y-4">
          <ThreatActorsTable actors={actors} isLoading={isActorsLoading} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <ThreatCampaignsTable campaigns={campaigns} isLoading={isCampaignsLoading} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <ThreatRiskDashboard
            risk={risk}
            activity={activity}
            geography={geography}
            isLoading={isRiskLoading || isActivityLoading || isGeographyLoading}
          />
        </TabsContent>

        <TabsContent value="feeds" className="space-y-4">
          <ThreatFeedsTable feeds={feeds} isLoading={isFeedsLoading} onAddFeed={() => setFeedModalOpen(true)} />
        </TabsContent>

        <TabsContent value="watchlists" className="space-y-4">
          <ThreatWatchlistsTable watchlists={watchlists} isLoading={isWatchlistsLoading} />
        </TabsContent>
      </Tabs>

      <ThreatFeedModal open={feedModalOpen} onOpenChange={setFeedModalOpen} />
      <ThreatReportModal open={reportModalOpen} onOpenChange={setReportModalOpen} />
      <ThreatSearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </div>
  );
}
