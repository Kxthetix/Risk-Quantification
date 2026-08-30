"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useThreatScenarios } from "@/features/risk-quantification/hooks";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Layers, TrendingDown, DollarSign } from "lucide-react";

export default function CompareScenariosPage() {
  const { currency } = useOrganization();
  const { data: scenarios } = useThreatScenarios();

  const comparisonItems = [
    {
      name: "Double-Extortion Ransomware",
      aro: 0.35,
      sle: 51400000,
      eal: 18000000,
      p50: 12000000,
      p90: 38000000,
      p95: 54000000,
      p99: 72000000,
      downtime_hours: 18,
      category: "RANSOMWARE",
    },
    {
      name: "Cloud IAM Privilege Escalation",
      aro: 0.42,
      sle: 28500000,
      eal: 12000000,
      p50: 8400000,
      p90: 24000000,
      p95: 36000000,
      p99: 48000000,
      downtime_hours: 8,
      category: "CLOUD_OUTAGE",
    },
    {
      name: "Customer PII Exfiltration Breach",
      aro: 0.20,
      sle: 48000000,
      eal: 9600000,
      p50: 6500000,
      p90: 22000000,
      p95: 32000000,
      p99: 45000000,
      downtime_hours: 4,
      category: "DATA_BREACH",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 text-xs">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risk-quantification"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Comparative Scenario Analysis</h1>
          <p className="text-xs text-muted-foreground">
            Side-by-side benchmarking of loss distributions, exceedance percentiles, and operational exposure.
          </p>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonItems.map((item) => (
          <Card key={item.name} className="border-border bg-card">
            <CardHeader className="pb-3">
              <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground w-fit mb-1">
                {item.category.replace(/_/g, " ")}
              </span>
              <CardTitle className="text-sm font-semibold">{item.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5 border-b border-border/40 pb-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Frequency (ARO):</span>
                  <span className="font-mono font-bold text-foreground">{item.aro.toFixed(2)}/yr</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Single Loss (SLE):</span>
                  <span className="font-mono font-bold text-foreground">{formatCurrency(item.sle, { currency, compact: true })}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Expected Loss (EAL):</span>
                  <span className="font-mono font-bold">{formatCurrency(item.eal, { currency, compact: true })}</span>
                </div>
              </div>

              <div className="space-y-1 text-muted-foreground font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>P50 Median:</span>
                  <span>{formatCurrency(item.p50, { currency, compact: true })}</span>
                </div>
                <div className="flex justify-between text-orange-500">
                  <span>P90 Severe:</span>
                  <span>{formatCurrency(item.p90, { currency, compact: true })}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-bold">
                  <span>P95 Critical:</span>
                  <span>{formatCurrency(item.p95, { currency, compact: true })}</span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                  <span>P99 Worst-Case:</span>
                  <span>{formatCurrency(item.p99, { currency, compact: true })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
