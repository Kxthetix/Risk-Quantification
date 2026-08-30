"use client";

import React from "react";
import {
  IncidentSummaryCards,
  IncidentsTable,
  useIncidents,
  useIncidentsSummary,
} from "@/features/incidents";
import { Button } from "@/components/ui/button";
import { Flame, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { INCIDENTS_KEYS } from "@/features/incidents";

export default function IncidentsPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading: isSummaryLoading, isRefetching } = useIncidentsSummary();
  const { data: incidents = [], isLoading: isIncidentsLoading } = useIncidents();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: INCIDENTS_KEYS.all });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-500">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Incident Response & War Room
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative incident lifecycle management, investigation evidence tracking, and automated SOAR response execution.
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
            Refresh Incidents
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <IncidentSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Incidents Table */}
      <IncidentsTable incidents={incidents} isLoading={isIncidentsLoading} />
    </div>
  );
}
