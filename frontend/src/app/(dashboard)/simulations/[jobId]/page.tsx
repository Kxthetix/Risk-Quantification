"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSimulationStatus } from "@/features/risk-quantification/hooks";
import { LossDistributionChart } from "@/features/risk-quantification/components/LossDistributionChart";
import { PercentileCards } from "@/features/risk-quantification/components/PercentileCards";
import { RiskQuantificationSummary } from "@/features/risk-quantification/components/RiskQuantificationSummary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Cpu, CheckCircle2, History, Layers } from "lucide-react";
import { formatDateTime } from "@/lib/utils/date";

export default function SimulationDetailPage() {
  const params = useParams();
  const jobId = (params?.jobId as string) || "sim-job-001";
  const { data: job } = useSimulationStatus(jobId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/simulations"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-foreground">{jobId}</h1>
              <span className="rounded bg-emerald-500/15 text-emerald-500 px-2 py-0.5 text-[10px] font-bold">
                COMPLETED
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              FAIR Quantitative Risk Engine • Model Version 2.4.1
            </p>
          </div>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">Iterations Count</span>
            <strong className="text-sm font-mono text-foreground">50,000 runs</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Pseudo-Random Seed</span>
            <strong className="text-sm font-mono text-foreground">42</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Convergence Confidence</span>
            <strong className="text-sm font-mono text-emerald-500">99.8% Stable</strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Execution Timestamp</span>
            <strong className="text-xs font-mono text-foreground">{formatDateTime(new Date().toISOString())}</strong>
          </div>
        </CardContent>
      </Card>

      {/* FAIR Metrics */}
      <RiskQuantificationSummary />

      {/* Loss Distribution Chart & Percentile Cards */}
      <LossDistributionChart />
      <PercentileCards />
    </div>
  );
}
