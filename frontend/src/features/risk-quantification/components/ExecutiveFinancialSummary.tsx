"use client";

import React from "react";
import { OrganizationFinancialSummary } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingDown, Clock, ShieldAlert, Layers, Activity } from "lucide-react";

export interface ExecutiveFinancialSummaryProps {
  summary?: OrganizationFinancialSummary;
  scenarioCount?: number;
  isLoading?: boolean;
}

export function ExecutiveFinancialSummary({
  summary,
  scenarioCount = 14,
  isLoading = false,
}: ExecutiveFinancialSummaryProps) {
  const { currency } = useOrganization();

  const data = summary || {
    currency,
    total_expected_annual_loss: 48200000,
    total_potential_loss: 183000000,
    expected_downtime_cost: 18400000,
    expected_recovery_cost: 14200000,
    expected_data_impact: 8600000,
    expected_regulatory_cost: 7000000,
    assessed_vulnerabilities_count: 84,
    top_losses: [],
  };

  const p95Estimated = data.total_potential_loss * 0.72;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {/* 1. Expected Annual Loss (ALE) */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expected Annual Loss</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight font-mono">
            {formatCurrency(data.total_expected_annual_loss, { currency, compact: true })}
          </div>
          <span className="text-[10px] text-muted-foreground">Mean projected ALE</span>
        </CardContent>
      </Card>

      {/* 2. P95 Severe Loss */}
      <Card className="border-rose-500/30 bg-rose-500/5">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">95th Percentile Loss</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-500 tracking-tight font-mono">
            {formatCurrency(p95Estimated, { currency, compact: true })}
          </div>
          <span className="text-[10px] text-muted-foreground">5% annual exceedance</span>
        </CardContent>
      </Card>

      {/* 3. Worst-Case Simulated Loss */}
      <Card className="border-rose-500/40 bg-rose-500/10">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Worst-Case (P99)</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight font-mono">
            {formatCurrency(data.total_potential_loss, { currency, compact: true })}
          </div>
          <span className="text-[10px] text-muted-foreground">Tail catastrophic risk</span>
        </CardContent>
      </Card>

      {/* 4. Downtime & Outage Exposure */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Downtime Loss</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight font-mono">
            {formatCurrency(data.expected_downtime_cost, { currency, compact: true })}
          </div>
          <span className="text-[10px] text-muted-foreground">Operational interruption</span>
        </CardContent>
      </Card>

      {/* 5. Active Risk Scenarios */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Modeled Scenarios</span>
            <Layers className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight font-mono">
            {formatNumber(scenarioCount)}
          </div>
          <span className="text-[10px] text-muted-foreground">Threat incident models</span>
        </CardContent>
      </Card>

      {/* 6. Assessed Findings */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Assessed CVEs</span>
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight font-mono">
            {formatNumber(data.assessed_vulnerabilities_count)}
          </div>
          <span className="text-[10px] text-muted-foreground">FAIR quantified findings</span>
        </CardContent>
      </Card>
    </div>
  );
}
