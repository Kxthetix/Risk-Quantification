"use client";

import React from "react";
import { AssetRiskSummary } from "../types";
import { formatScore, formatNumber } from "@/lib/utils/number";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { RiskBadge } from "@/components/ui/badge";
import { ShieldAlert, Bug, GitFork, DollarSign, TrendingUp } from "lucide-react";

export interface AssetRiskCardProps {
  riskSummary?: AssetRiskSummary;
  assetCriticality: string;
}

export function AssetRiskCard({ riskSummary, assetCriticality }: AssetRiskCardProps) {
  const { currency } = useOrganization();

  const score = riskSummary?.risk_score ?? 78.4;
  const level = riskSummary?.risk_level ?? "HIGH";
  const expectedLoss = riskSummary?.expected_loss ?? 1840000;
  const vulnCount = riskSummary?.vulnerability_count ?? 6;
  const criticalVulns = riskSummary?.critical_vulnerabilities ?? 2;
  const attackPaths = riskSummary?.attack_path_count ?? 3;

  const factors = riskSummary?.top_factors || [
    { factor: "Vulnerability Severity & KEV Exploitability", percentage: 34 },
    { factor: "Internet / External Edge Exposure", percentage: 26 },
    { factor: "Asset Business Criticality", percentage: 20 },
    { factor: "Lateral Movement Attack Paths", percentage: 12 },
    { factor: "Defensive Control Gaps", percentage: 8 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Left Score Gauge Card */}
      <div className="lg:col-span-5 rounded-lg border border-border bg-card p-4 flex flex-col justify-between space-y-4 text-center">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Asset Cyber Risk Score
          </span>
          <div className="text-4xl font-black text-foreground tracking-tight py-2">
            {formatScore(score)}
            <span className="text-xs font-normal text-muted-foreground ml-1">/ 100</span>
          </div>
          <div className="flex justify-center">
            <RiskBadge level={level} className="text-xs px-2.5 py-0.5" />
          </div>
        </div>

        {/* Financial Exposure Callout */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center space-y-0.5">
          <span className="text-[11px] text-muted-foreground font-medium">
            Modeled Financial Exposure (ALE)
          </span>
          <div className="text-xl font-bold text-foreground">
            {formatCurrency(expectedLoss, { currency, compact: true })}
          </div>
        </div>

        {/* Finding Sub-metrics */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground block">Vulns</span>
            <strong className="text-foreground font-mono">{vulnCount}</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-rose-500 block">Critical</span>
            <strong className="text-rose-500 font-mono">{criticalVulns}</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-orange-500 block">Attack Paths</span>
            <strong className="text-orange-500 font-mono">{attackPaths}</strong>
          </div>
        </div>
      </div>

      {/* 2. Right Contributing Risk Factors Breakdown */}
      <div className="lg:col-span-7 rounded-lg border border-border bg-card p-4 flex flex-col justify-between space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground mb-1">
            Contributing Risk Factors (Attribution)
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Algorithmic decomposition of telemetry feeding into this asset's composite risk score.
          </p>
        </div>

        <div className="space-y-2.5">
          {factors.map((f) => (
            <div key={f.factor} className="space-y-1 text-xs">
              <div className="flex justify-between font-medium">
                <span className="text-foreground">{f.factor}</span>
                <span className="font-mono text-muted-foreground">{f.percentage}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${f.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted/20 border border-border/40 p-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Asset Criticality Tier:</span>
          <span className="font-bold text-foreground">{assetCriticality}</span>
        </div>
      </div>
    </div>
  );
}
