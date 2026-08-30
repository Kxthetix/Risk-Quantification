"use client";

import React from "react";
import {
  MonitoringOverviewCards,
  RealtimeEventStream,
  DataSourcesTable,
  MonitoringHealthCard,
  useMonitoringDashboard,
  useDataSources,
  useMonitoringHealth,
} from "@/features/monitoring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Radio } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { MONITORING_KEYS } from "@/features/monitoring";

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading: isDashLoading, isRefetching } = useMonitoringDashboard();
  const { data: sources = [], isLoading: isSourcesLoading } = useDataSources();
  const { data: health, isLoading: isHealthLoading } = useMonitoringHealth();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: MONITORING_KEYS.all });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Real-Time Security Telemetry & Monitoring
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative continuous ingestion and normalization of security events, EDR alerts, and firewall flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh Stream
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <MonitoringOverviewCards dashboard={dashboard} isLoading={isDashLoading} />

      {/* Health Bar */}
      <MonitoringHealthCard health={health} isLoading={isHealthLoading} />

      {/* Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <TabsTrigger value="events" className="text-xs">
            Live Event Stream
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">
            Connected Telemetry Pipelines ({sources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <RealtimeEventStream />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <DataSourcesTable sources={sources} isLoading={isSourcesLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
