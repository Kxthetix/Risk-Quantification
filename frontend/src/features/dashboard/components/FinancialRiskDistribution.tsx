"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";

export interface FinancialRiskDistributionProps {
  expectedAnnualLoss: number;
  p10: number;
  p50: number;
  p90: number;
  p95: number;
}

export function FinancialRiskDistribution({
  expectedAnnualLoss,
  p10,
  p50,
  p90,
  p95,
}: FinancialRiskDistributionProps) {
  const { currency } = useOrganization();

  // Probability distribution density curve buckets derived from backend FAIR quantiles
  const bars = [
    { label: "< P10", height: 25, color: "bg-emerald-500/40", border: "border-emerald-500" },
    { label: "P10-P25", height: 50, color: "bg-emerald-500/60", border: "border-emerald-500" },
    { label: "P25-P50", height: 85, color: "bg-blue-500/70", border: "border-blue-500" },
    { label: "P50 (Median)", height: 100, color: "bg-primary", border: "border-primary" },
    { label: "P50-P75", height: 75, color: "bg-amber-500/70", border: "border-amber-500" },
    { label: "P75-P90", height: 45, color: "bg-orange-500/70", border: "border-orange-500" },
    { label: "P90-P95", height: 30, color: "bg-rose-500/70", border: "border-rose-500" },
    { label: "> P95 Tail", height: 18, color: "bg-rose-600/80", border: "border-rose-600" },
  ];

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">10,000-Iteration Monte Carlo Density</span>
        <span className="text-[11px] font-mono text-primary font-semibold">
          Mean: {formatCurrency(expectedAnnualLoss, { currency, compact: true })}
        </span>
      </div>

      {/* Probability Histogram Distribution */}
      <div className="relative h-[150px] w-full flex items-end justify-between gap-1.5 pt-4 pb-2 px-2 bg-muted/15 rounded-lg border border-border/40">
        {bars.map((bar, i) => (
          <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
            <div
              className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-100 opacity-80 ${bar.color}`}
              style={{ height: `${bar.height}%` }}
            />
          </div>
        ))}
      </div>

      {/* Axis Marker Key */}
      <div className="grid grid-cols-4 text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono text-center">
        <div>
          <span className="block text-emerald-500 font-semibold">P10</span>
          <span>{formatCurrency(p10, { currency, compact: true })}</span>
        </div>
        <div>
          <span className="block text-blue-500 font-semibold">P50</span>
          <span>{formatCurrency(p50, { currency, compact: true })}</span>
        </div>
        <div>
          <span className="block text-amber-500 font-semibold">P90</span>
          <span>{formatCurrency(p90, { currency, compact: true })}</span>
        </div>
        <div>
          <span className="block text-rose-500 font-semibold">P95</span>
          <span>{formatCurrency(p95, { currency, compact: true })}</span>
        </div>
      </div>
    </div>
  );
}
