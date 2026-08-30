"use client";

import React from "react";
import {
  SOCMetricsDashboard,
  SOCTrendCharts,
  useSOCMetrics,
} from "@/features/soc";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw } from "lucide-react";

export default function SOCMetricsPage() {
  const { data: metrics, isLoading, refetch, isFetching } = useSOCMetrics();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            SOC Operational Metrics & MTTx Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative Mean Time to Detect (MTTD), Acknowledge (MTTA), Contain (MTTC), Resolve (MTTR), and automation ROI.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <SOCMetricsDashboard metrics={metrics} isLoading={isLoading} />

      <SOCTrendCharts />
    </div>
  );
}
