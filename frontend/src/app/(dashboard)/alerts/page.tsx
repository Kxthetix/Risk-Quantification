"use client";

import React from "react";
import {
  AlertSummaryCards,
  AlertsTable,
  useAlerts,
  useAlertsSummary,
} from "@/features/alerts";
import { Button } from "@/components/ui/button";
import { Bell, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { ALERTS_KEYS } from "@/features/alerts";

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const { data: summary, isLoading: isSummaryLoading, isRefetching } = useAlertsSummary();
  const { data: alerts = [], isLoading: isAlertsLoading } = useAlerts();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ALERTS_KEYS.all });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-400">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Security & Anomaly Alerts Management
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative multi-factor alert triage, correlation, false-positive suppression, and incident escalation.
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
            Refresh Alerts
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <AlertSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Alerts Table */}
      <AlertsTable alerts={alerts} isLoading={isAlertsLoading} />
    </div>
  );
}
