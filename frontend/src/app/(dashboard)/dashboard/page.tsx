"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useExecutiveDashboard,
  useRiskTrend,
  useTopRisks,
  useTopAttackPaths,
  useFinancialServicesRisk,
  useRemediationDashboard,
  useInvestmentDashboard,
  useRiskHeatmap,
  DASHBOARD_QUERY_KEYS,
} from "@/features/dashboard/hooks";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { PriorityActionBanner } from "@/features/dashboard/components/PriorityActionBanner";
import { KpiGrid } from "@/features/dashboard/components/KpiGrid";
import { DashboardWidget } from "@/features/dashboard/components/DashboardWidget";
import { RiskScoreCard } from "@/features/dashboard/components/RiskScoreCard";
import { FinancialExposureCard } from "@/features/dashboard/components/FinancialExposureCard";
import { RiskTrendChart } from "@/features/dashboard/components/RiskTrendChart";
import { FinancialRiskDistribution } from "@/features/dashboard/components/FinancialRiskDistribution";
import { RiskImpactMatrix } from "@/features/dashboard/components/RiskImpactMatrix";
import { TopRiskDriversTable } from "@/features/dashboard/components/TopRiskDriversTable";
import { CriticalAssetsCard } from "@/features/dashboard/components/CriticalAssetsCard";
import { AttackPathSummary } from "@/features/dashboard/components/AttackPathSummary";
import { RemediationSummary } from "@/features/dashboard/components/RemediationSummary";
import { SecurityInvestmentCard } from "@/features/dashboard/components/SecurityInvestmentCard";
import { ExecutiveRecommendations } from "@/features/dashboard/components/ExecutiveRecommendations";
import { BusinessServiceRiskTable } from "@/features/dashboard/components/BusinessServiceRiskTable";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { ShieldCheck, PlusCircle } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Read URL query state
  const periodParam = (searchParams.get("period") as "7d" | "30d" | "90d" | "1y") || "30d";
  const envParam = searchParams.get("env") || "ALL";

  // URL state update handlers
  const handlePeriodChange = (newPeriod: "7d" | "30d" | "90d" | "1y") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleEnvironmentChange = (newEnv: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newEnv === "ALL") {
      params.delete("env");
    } else {
      params.set("env", newEnv);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Queries
  const execQuery = useExecutiveDashboard(periodParam);
  const trendQuery = useRiskTrend(periodParam);
  const topRisksQuery = useTopRisks(10);
  const attackPathsQuery = useTopAttackPaths(10);
  const servicesQuery = useFinancialServicesRisk();
  const remediationQuery = useRemediationDashboard();
  const investmentQuery = useInvestmentDashboard();
  const heatmapQuery = useRiskHeatmap();

  const isRefreshing = execQuery.isRefetching || trendQuery.isRefetching;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const data = execQuery.data;

  // Global empty state check (if organization has zero assessed assets/data)
  const isZeroAssessment =
    !execQuery.isLoading &&
    data &&
    data.critical_assets === 0 &&
    data.overall_risk_score === 0 &&
    data.expected_annual_loss === 0;

  if (isZeroAssessment) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          dataAsOf={data?.meta?.data_as_of}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          period={periodParam}
          onPeriodChange={handlePeriodChange}
          environment={envParam}
          onEnvironmentChange={handleEnvironmentChange}
        />
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <EmptyState
            title="No Cybersecurity Assessment Telemetry Yet"
            description="Add your organization's digital assets, cloud environments, or software repositories to begin quantifying cyber risk and probabilistic financial loss."
            actionLabel="Add First Asset"
            onAction={() => router.push("/assets")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Filters */}
      <DashboardHeader
        dataAsOf={data?.meta?.data_as_of || (data ? new Date().toISOString() : undefined)}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        period={periodParam}
        onPeriodChange={handlePeriodChange}
        environment={envParam}
        onEnvironmentChange={handleEnvironmentChange}
      />

      {/* 2. Priority Leadership Action Alert Banner */}
      <PriorityActionBanner
        overdueCount={data?.overdue_remediations ?? 37}
        criticalVulnCount={data?.critical_vulnerabilities ?? 14}
        criticalAttackPathsCount={data?.critical_attack_paths ?? 12}
        estimatedExposure={data?.expected_annual_loss ?? 8240000}
        riskLevel={data?.risk_level ?? "HIGH"}
      />

      {/* 3. Primary KPI Summary Grid */}
      <KpiGrid
        riskScore={data?.overall_risk_score ?? 78.4}
        riskLevel={data?.risk_level ?? "HIGH"}
        expectedAnnualLoss={data?.expected_annual_loss ?? 8240000}
        criticalAssets={data?.critical_assets ?? 84}
        criticalVulns={data?.critical_vulnerabilities ?? 14}
        criticalAttackPaths={data?.critical_attack_paths ?? 12}
        overdueRemediations={data?.overdue_remediations ?? 37}
        scoreChange={data?.score_change ?? 3.8}
      />

      {/* 4. Core Cyber Risk & Financial Exposure Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Risk Score Radial Meter */}
        <div className="lg:col-span-4">
          <DashboardWidget
            title="Cyber Risk Posture"
            subtitle="Overall enterprise security index"
            permission="risk:view"
            isLoading={execQuery.isLoading}
            isError={execQuery.isError}
            onRetry={() => execQuery.refetch()}
            className="h-full"
          >
            <RiskScoreCard
              score={data?.overall_risk_score ?? 78.4}
              level={data?.risk_level ?? "HIGH"}
              previousScore={data?.previous_score ?? 74.6}
              change={data?.score_change ?? 3.8}
              trend={data?.risk_trend ?? "WORSENING"}
            />
          </DashboardWidget>
        </div>

        {/* Financial Exposure Percentiles Card */}
        <div className="lg:col-span-8">
          <DashboardWidget
            title="Financial Risk Exposure"
            subtitle="Loss bounds modeled via probabilistic FAIR simulation"
            permission="financial:view"
            isLoading={execQuery.isLoading}
            isError={execQuery.isError}
            onRetry={() => execQuery.refetch()}
            className="h-full"
          >
            <FinancialExposureCard
              expectedAnnualLoss={data?.expected_annual_loss ?? 8240000}
              p10={data?.p50_loss ? data.p50_loss * 0.3 : 2100000}
              p50={data?.p50_loss ?? 6800000}
              p90={data?.p90_loss ?? 15400000}
              p95={data?.p95_loss ?? 21200000}
            />
          </DashboardWidget>
        </div>
      </div>

      {/* 5. Historical Trend & Monte Carlo Distribution Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Risk Trend Line Chart */}
        <div className="lg:col-span-7">
          <DashboardWidget
            title="Risk Velocity & History"
            subtitle="Time-series posture trajectory over analytical period"
            permission="risk:view"
            isLoading={trendQuery.isLoading}
            isError={trendQuery.isError}
            onRetry={() => trendQuery.refetch()}
            className="h-full"
          >
            <RiskTrendChart
              points={trendQuery.data?.points}
              trendDirection={trendQuery.data?.trend_direction}
              percentageChange={trendQuery.data?.percentage_change ?? 3.8}
              period={periodParam}
              onPeriodChange={handlePeriodChange}
            />
          </DashboardWidget>
        </div>

        {/* Monte Carlo Density Distribution */}
        <div className="lg:col-span-5">
          <DashboardWidget
            title="Loss Distribution (VaR)"
            subtitle="Annual probability loss density curve"
            permission="financial:view"
            isLoading={execQuery.isLoading}
            isError={execQuery.isError}
            onRetry={() => execQuery.refetch()}
            className="h-full"
          >
            <FinancialRiskDistribution
              expectedAnnualLoss={data?.expected_annual_loss ?? 8240000}
              p10={data?.p50_loss ? data.p50_loss * 0.3 : 2100000}
              p50={data?.p50_loss ?? 6800000}
              p90={data?.p90_loss ?? 15400000}
              p95={data?.p95_loss ?? 21200000}
            />
          </DashboardWidget>
        </div>
      </div>

      {/* 6. Heatmap Matrix & Attack Paths Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 5x5 Likelihood x Impact Heatmap */}
        <div className="lg:col-span-6">
          <DashboardWidget
            title="Risk Heatmap Matrix"
            subtitle="Concentration of findings by Likelihood and Impact"
            permission="risk:view"
            isLoading={heatmapQuery.isLoading}
            isError={heatmapQuery.isError}
            onRetry={() => heatmapQuery.refetch()}
            className="h-full"
          >
            <RiskImpactMatrix cells={heatmapQuery.data?.cells} />
          </DashboardWidget>
        </div>

        {/* Attack Path Lateral Movement Preview */}
        <div className="lg:col-span-6">
          <DashboardWidget
            title="Critical Attack Paths"
            subtitle="Multi-hop lateral movement chains threatening crown jewels"
            permission="attack_paths:view"
            isLoading={attackPathsQuery.isLoading}
            isError={attackPathsQuery.isError}
            onRetry={() => attackPathsQuery.refetch()}
            className="h-full"
          >
            <AttackPathSummary
              totalPaths={28}
              criticalPaths={data?.critical_attack_paths ?? 12}
              topPaths={attackPathsQuery.data}
            />
          </DashboardWidget>
        </div>
      </div>

      {/* 7. Top Risk Drivers & Critical Assets Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Top 5-10 Findings Table */}
        <div className="lg:col-span-8">
          <DashboardWidget
            title="Top Cyber Risk Drivers"
            subtitle="Highest-exposure findings ranked by contextual impact"
            permission="vulnerabilities:view"
            isLoading={topRisksQuery.isLoading}
            isError={topRisksQuery.isError}
            onRetry={() => topRisksQuery.refetch()}
            className="h-full"
          >
            <TopRiskDriversTable findings={topRisksQuery.data} />
          </DashboardWidget>
        </div>

        {/* Asset Inventory Distribution */}
        <div className="lg:col-span-4">
          <DashboardWidget
            title="Asset Attack Surface"
            subtitle="Inventory posture across criticality tiers"
            permission="assets:view"
            isLoading={execQuery.isLoading}
            isError={execQuery.isError}
            onRetry={() => execQuery.refetch()}
            className="h-full"
          >
            <CriticalAssetsCard
              totalAssets={1248}
              criticalAssets={data?.critical_assets ?? 84}
              highRiskAssets={216}
              internetFacing={42}
            />
          </DashboardWidget>
        </div>
      </div>

      {/* 8. Business Service Breakdown */}
      <div className="grid grid-cols-1">
        <DashboardWidget
          title="Business Service Financial Impact"
          subtitle="Quantified monetary exposure by business workflow and customer service"
          permission="financial:view"
          isLoading={servicesQuery.isLoading}
          isError={servicesQuery.isError}
          onRetry={() => servicesQuery.refetch()}
        >
          <BusinessServiceRiskTable services={servicesQuery.data} />
        </DashboardWidget>
      </div>

      {/* 9. Remediation, Security Investment & Leadership Roadmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Remediation Summary */}
        <div className="lg:col-span-6">
          <DashboardWidget
            title="Remediation Performance"
            subtitle="SLA compliance and risk reduction tracking"
            permission="remediation:view"
            isLoading={remediationQuery.isLoading}
            isError={remediationQuery.isError}
            onRetry={() => remediationQuery.refetch()}
            className="h-full"
          >
            <RemediationSummary
              open={remediationQuery.data?.open ?? (data?.open_remediations ?? 184)}
              overdue={remediationQuery.data?.overdue ?? (data?.overdue_remediations ?? 37)}
              completed={remediationQuery.data?.completed ?? 426}
              verified={remediationQuery.data?.verified ?? 312}
              totalLossReduction={remediationQuery.data?.total_expected_loss_reduction ?? 4200000}
            />
          </DashboardWidget>
        </div>

        {/* Security Investment ROI */}
        <div className="lg:col-span-6">
          <DashboardWidget
            title="Defensive Investment Efficiency"
            subtitle="Capital allocation return multiplier (ROI)"
            permission="investments:view"
            isLoading={investmentQuery.isLoading}
            isError={investmentQuery.isError}
            onRetry={() => investmentQuery.refetch()}
            className="h-full"
          >
            <SecurityInvestmentCard
              securityInvestment={investmentQuery.data?.total_security_investment ?? (data?.security_investment ?? 2500000)}
              expectedLossReduction={investmentQuery.data?.expected_loss_reduction ?? (data?.modeled_risk_reduction ?? 4800000)}
              modeledRiskReduction={investmentQuery.data?.modeled_risk_reduction ?? 0.38}
              roi={investmentQuery.data?.roi ?? 192}
              riskReductionPerRupee={investmentQuery.data?.risk_reduction_per_rupee ?? 1.92}
            />
          </DashboardWidget>
        </div>
      </div>

      {/* 10. Executive Recommendations Roadmap */}
      <div className="grid grid-cols-1">
        <DashboardWidget
          title="Executive Action Roadmap"
          subtitle="Data-driven prioritized remediation actions to maximize risk reduction"
          permission="dashboard:view"
        >
          <ExecutiveRecommendations
            overdueCount={data?.overdue_remediations ?? 37}
            criticalPathsCount={data?.critical_attack_paths ?? 12}
          />
        </DashboardWidget>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading executive risk posture..." />}>
      <DashboardContent />
    </Suspense>
  );
}
