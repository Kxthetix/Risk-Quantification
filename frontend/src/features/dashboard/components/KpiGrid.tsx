"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber, formatScore } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { RiskBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Server,
  Bug,
  GitFork,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export interface KpiGridProps {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expectedAnnualLoss: number;
  criticalAssets: number;
  criticalVulns: number;
  criticalAttackPaths: number;
  overdueRemediations: number;
  scoreChange?: number;
}

export function KpiGrid({
  riskScore,
  riskLevel,
  expectedAnnualLoss,
  criticalAssets,
  criticalVulns,
  criticalAttackPaths,
  overdueRemediations,
  scoreChange = 3.8,
}: KpiGridProps) {
  const { currency } = useOrganization();

  const isScoreImproving = scoreChange < 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. Cyber Risk Score */}
      <Link href="/risk" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-primary/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Cyber Risk</span>
              <ShieldAlert className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {formatScore(riskScore)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <RiskBadge level={riskLevel} className="text-[10px] py-0 px-1.5" />
                <span
                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                    isScoreImproving ? "text-emerald-500" : "text-rose-500"
                  }`}
                >
                  {isScoreImproving ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  <span>{Math.abs(scoreChange)}%</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 2. Expected Annual Loss */}
      <Link href="/financial-risk" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-emerald-500/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Expected Loss</span>
              <DollarSign className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {formatCurrency(expectedAnnualLoss, { currency, compact: true })}
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Mean Annual Exposure (ALE)
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 3. Critical Assets */}
      <Link href="/assets?criticality=CRITICAL" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-amber-500/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Assets</span>
              <Server className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {formatNumber(criticalAssets)}
              </div>
              <span className="text-[11px] text-amber-500 font-medium block mt-1">
                High-Value Workloads
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 4. Critical Vulnerabilities */}
      <Link href="/vulnerabilities?severity=CRITICAL" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-rose-500/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Critical Vulns</span>
              <Bug className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-500 tracking-tight">
                {formatNumber(criticalVulns)}
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Known Exploited (KEV)
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 5. Critical Attack Paths */}
      <Link href="/attack-paths" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-orange-500/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Attack Paths</span>
              <GitFork className="h-4 w-4 text-orange-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {formatNumber(criticalAttackPaths)}
              </div>
              <span className="text-[11px] text-orange-500 font-medium block mt-1">
                Active Lateral Chains
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* 6. Overdue Remediations */}
      <Link href="/remediation?status=overdue" className="group block focus:outline-none">
        <Card className="border-border bg-card/80 transition-all hover:border-rose-500/50 hover:shadow-md h-full">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue SLA</span>
              <Clock className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-500 tracking-tight">
                {formatNumber(overdueRemediations)}
              </div>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Actions Past Due Date
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
