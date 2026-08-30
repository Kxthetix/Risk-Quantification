"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useThreatScenario } from "@/features/risk-quantification/hooks";
import { LossDistributionChart } from "@/features/risk-quantification/components/LossDistributionChart";
import { PercentileCards } from "@/features/risk-quantification/components/PercentileCards";
import { RiskQuantificationSummary } from "@/features/risk-quantification/components/RiskQuantificationSummary";
import { ScenarioWhatIf } from "@/features/risk-quantification/components/ScenarioWhatIf";
import { SimulationPanel } from "@/features/risk-quantification/components/SimulationPanel";
import { RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import {
  ArrowLeft,
  Layers,
  Server,
  DollarSign,
  Clock,
  ShieldAlert,
  Play,
  Sliders,
} from "lucide-react";

export default function ScenarioDetailPage() {
  const params = useParams();
  const scenarioId = (params?.id as string) || "";
  const { currency } = useOrganization();

  const { data: scenario, isLoading } = useThreatScenario(scenarioId);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-64 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  const sc = scenario || {
    id: scenarioId,
    name: "Double-Extortion Ransomware on Core Payment Gateways",
    category: "RANSOMWARE",
    business_service: "Payment Processing",
    status: "ACTIVE",
    annual_rate_of_occurrence: 0.35,
    single_loss_expectancy: 51400000,
    expected_annual_loss: 18000000,
    p95_loss: 54000000,
    risk_level: "CRITICAL",
    affected_assets_count: 6,
    affected_asset_ids: ["asset-1", "asset-2"],
    description: "Adversary exploits unauthenticated remote code execution on edge gateways, establishes persistence, drops double-extortion ransomware, and threatens public exfiltration.",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-xs">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/risk-quantification/scenarios"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{sc.name}</h1>
              <RiskBadge level={sc.risk_level as any} className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{sc.category} • {sc.business_service}</p>
          </div>
        </div>

        <Button size="sm" className="h-8 text-xs gap-1.5" asChild>
          <Link href="#simulation">
            <Play className="h-3.5 w-3.5" />
            <span>Re-Run Simulation</span>
          </Link>
        </Button>
      </div>

      {/* 2. Narrative */}
      {sc.description && (
        <Card className="border-border bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Attack Vector Narrative &amp; Threat Model
            </span>
            <p className="text-muted-foreground leading-relaxed">{sc.description}</p>
          </CardContent>
        </Card>
      )}

      {/* 3. FAIR Metrics Card */}
      <RiskQuantificationSummary
        aro={sc.annual_rate_of_occurrence}
        sle={sc.single_loss_expectancy}
        eal={sc.expected_annual_loss}
        p95={sc.p95_loss}
      />

      {/* 4. Loss Distribution & Percentiles */}
      <LossDistributionChart
        percentiles={{
          expected_loss: sc.expected_annual_loss,
          p10: sc.expected_annual_loss * 0.2,
          p50: sc.expected_annual_loss * 0.7,
          p90: sc.p95_loss * 0.8,
          p95: sc.p95_loss,
          p99: sc.p95_loss * 1.3,
        }}
      />

      <PercentileCards
        percentiles={{
          expected_loss: sc.expected_annual_loss,
          p10: sc.expected_annual_loss * 0.2,
          p50: sc.expected_annual_loss * 0.7,
          p90: sc.p95_loss * 0.8,
          p95: sc.p95_loss,
          p99: sc.p95_loss * 1.3,
        }}
      />

      {/* 5. What-If Stress Testing */}
      <ScenarioWhatIf assetVulnerabilityId={sc.id} />

      {/* 6. Simulation Panel */}
      <div id="simulation">
        <SimulationPanel assetVulnerabilityId={sc.id} />
      </div>
    </div>
  );
}
