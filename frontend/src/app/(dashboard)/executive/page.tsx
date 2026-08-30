"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText, BarChart3, HelpCircle, ShieldCheck } from "lucide-react";
import {
  ExecutiveKPIStrip,
  RiskScoreGauge,
  ExecutiveFinancialSummary,
  AttackPathSummaryCard,
} from "@/features/executive/components/ExecutiveDashboardWidgets";
import {
  RiskTrendChart,
  RiskDriverChart,
  LossDistributionChart,
} from "@/features/executive/components/Charts";
import { RiskHeatmap, TopRisksTable } from "@/features/executive/components/RiskHeatmap";
import { RecommendationsPanel } from "@/features/executive/components/RecommendationsPanel";
import { WhatIfScenarioPanel, ForecastChart } from "@/features/executive/components/ForecastAndScenarios";
import { useExecutiveSummary } from "@/features/executive/hooks";

export default function ExecutiveDashboardPage() {
  const { data: summary, refetch, isFetching } = useExecutiveSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Cyber Risk Dashboard"
        description="Strategic risk quantification, expected financial impact, and automated security decisions."
        breadcrumbs={[{ label: "Analytics" }, { label: "Executive View" }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 border-white/10 text-gray-300 hover:bg-slate-700/50"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
              <FileText className="h-4 w-4" />
              <span>Export PDF</span>
            </Button>
          </div>
        }
      />

      {/* KPI strips */}
      <ExecutiveKPIStrip />

      {/* Executive summary narrative */}
      {summary && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-white">CISO Executive Narrative</h3>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed font-sans">{summary.narrative}</p>
        </div>
      )}

      {/* Top gauges and summaries */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RiskScoreGauge />
        <div className="lg:col-span-2">
          <ExecutiveFinancialSummary />
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RiskTrendChart />
        <RiskDriverChart />
      </div>

      {/* Loss distribution and Attack Path */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LossDistributionChart />
        </div>
        <div>
          <AttackPathSummaryCard />
        </div>
      </div>

      {/* Heatmap & Risk table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TopRisksTable limit={5} />
        </div>
        <div>
          <RiskHeatmap />
        </div>
      </div>

      {/* Forecast & What-If Scenarios */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ForecastChart />
        </div>
        <div>
          <WhatIfScenarioPanel />
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 gap-6">
        <RecommendationsPanel limit={4} />
      </div>
    </div>
  );
}
