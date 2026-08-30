"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useOrganizationFinancialSummary,
  useTopLosses,
  useThreatScenarios,
} from "@/features/risk-quantification/hooks";
import { ExecutiveFinancialSummary } from "@/features/risk-quantification/components/ExecutiveFinancialSummary";
import { LossDistributionChart } from "@/features/risk-quantification/components/LossDistributionChart";
import { PercentileCards } from "@/features/risk-quantification/components/PercentileCards";
import { RiskQuantificationSummary } from "@/features/risk-quantification/components/RiskQuantificationSummary";
import { LossContributionChart } from "@/features/risk-quantification/components/LossContributionChart";
import { FinancialImpactWaterfall } from "@/features/risk-quantification/components/FinancialImpactWaterfall";
import { TopFinancialRisksTable } from "@/features/risk-quantification/components/TopFinancialRisksTable";
import { SimulationPanel } from "@/features/risk-quantification/components/SimulationPanel";
import { RiskAppetiteCard } from "@/features/risk-quantification/components/RiskAppetiteCard";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Play,
  Plus,
  BarChart2,
  Sliders,
  TrendingUp,
  FileSpreadsheet,
  Download,
} from "lucide-react";

export default function RiskQuantificationPage() {
  const { data: summary, isLoading: isSummaryLoading, refetch } = useOrganizationFinancialSummary();
  const { data: topLosses, isLoading: isLossesLoading } = useTopLosses(10);
  const { data: scenarios } = useThreatScenarios();

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              Cyber Risk Quantification &amp; Financial Impact
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              FAIR Standard
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quantify cyber risk in financial terms to justify security investments and optimize defense allocation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/risk-quantification/sensitivity">
              <BarChart2 className="h-3.5 w-3.5 text-primary" />
              <span>Sensitivity Tornado</span>
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/security-investment">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Control ROSI %</span>
            </Link>
          </Button>

          <Button size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/risk-quantification/scenarios/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Scenario</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Top Executive Financial KPIs */}
      <ExecutiveFinancialSummary
        summary={summary}
        scenarioCount={scenarios?.length || 14}
        isLoading={isSummaryLoading}
      />

      {/* 3. Board Risk Appetite Gauge */}
      <RiskAppetiteCard />

      {/* 4. Monte Carlo Loss Distribution & Percentiles */}
      <div className="space-y-3">
        <LossDistributionChart />
        <PercentileCards />
      </div>

      {/* 5. FAIR Model Summary & Factor Breakdown */}
      <RiskQuantificationSummary
        eal={summary?.total_expected_annual_loss}
        p90={summary ? summary.total_potential_loss * 0.6 : undefined}
        p95={summary ? summary.total_potential_loss * 0.72 : undefined}
      />

      {/* 6. Loss Factor Breakdown & Impact Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LossContributionChart />
        <FinancialImpactWaterfall
          downtime={summary?.expected_downtime_cost}
          recovery={summary?.expected_recovery_cost}
          regulatory={summary?.expected_regulatory_cost}
        />
      </div>

      {/* 7. Top Financial Cyber Risks Table */}
      <TopFinancialRisksTable findings={topLosses} />

      {/* 8. Monte Carlo Simulation Engine Trigger */}
      <SimulationPanel onSimulationCompleted={() => refetch()} />
    </div>
  );
}
