"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { DollarSign, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

export interface FinancialExposureCardProps {
  expectedAnnualLoss: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
  maximumModeledLoss?: number;
}

export function FinancialExposureCard({
  expectedAnnualLoss,
  p10,
  p50,
  p90,
  p95,
  maximumModeledLoss,
}: FinancialExposureCardProps) {
  const { currency } = useOrganization();

  return (
    <div className="flex flex-col justify-between h-full p-2 space-y-4">
      {/* Primary Headline Expected Loss */}
      <div className="space-y-1 text-center sm:text-left">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Expected Annual Loss (ALE)
        </span>
        <div className="text-3xl font-black text-foreground tracking-tight">
          {formatCurrency(expectedAnnualLoss, { currency, compact: true })}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Probabilistic annualized monetary loss derived from FAIR & Monte Carlo simulations.
        </p>
      </div>

      {/* Percentile Distribution Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>P10</span>
            <span className="text-[10px] text-emerald-500 font-semibold">Best Case</span>
          </div>
          <div className="text-sm font-bold text-foreground">
            {formatCurrency(p10, { currency, compact: true })}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>P50</span>
            <span className="text-[10px] text-blue-500 font-semibold">Median</span>
          </div>
          <div className="text-sm font-bold text-foreground">
            {formatCurrency(p50, { currency, compact: true })}
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>P90</span>
            <span className="text-[10px] text-amber-500 font-semibold">High Loss</span>
          </div>
          <div className="text-sm font-bold text-amber-500">
            {formatCurrency(p90, { currency, compact: true })}
          </div>
        </div>

        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-rose-500">
            <span>P95</span>
            <span className="text-[10px] font-bold">Severe Tail</span>
          </div>
          <div className="text-sm font-bold text-rose-500">
            {formatCurrency(p95, { currency, compact: true })}
          </div>
        </div>
      </div>

      {/* Tail Risk Callout */}
      {maximumModeledLoss && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md">
          <span>Maximum Modeled Loss (Worst Case Tail):</span>
          <strong className="text-foreground font-mono">
            {formatCurrency(maximumModeledLoss, { currency, compact: true })}
          </strong>
        </div>
      )}
    </div>
  );
}
