"use client";

import React from "react";
import { FinancialPercentiles } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent } from "@/components/ui/card";

export interface PercentileCardsProps {
  percentiles?: FinancialPercentiles;
}

export function PercentileCards({ percentiles }: PercentileCardsProps) {
  const { currency } = useOrganization();

  const data: FinancialPercentiles = percentiles || {
    p10: 1200000,
    p25: 3400000,
    p50: 6200000,
    p75: 9800000,
    p90: 14800000,
    p95: 18300000,
    p99: 26500000,
    expected_loss: 7450000,
  };

  const metrics = [
    { label: "P10 (Best-Case)", val: data.p10, note: "90% chance loss is higher", color: "text-emerald-500" },
    { label: "P25 (Optimistic)", val: data.p25 || data.p10 * 1.8, note: "75% chance loss is higher", color: "text-emerald-500" },
    { label: "P50 (Median Loss)", val: data.p50, note: "50% probable threshold", color: "text-blue-500" },
    { label: "P75 (Moderate Loss)", val: data.p75 || data.p50 * 1.4, note: "25% chance loss is higher", color: "text-amber-500" },
    { label: "P90 (Severe Loss)", val: data.p90, note: "10% tail exceedance", color: "text-orange-500" },
    { label: "P95 (Critical Tail)", val: data.p95, note: "5% catastrophic breach", color: "text-rose-500" },
    { label: "P99 (Worst Simulated)", val: data.p99 || data.p95 * 1.45, note: "1% maximum exposure", color: "text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {metrics.map((m) => (
        <Card key={m.label} className="border-border bg-card/70 shadow-xs">
          <CardContent className="p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground block truncate">
              {m.label}
            </span>
            <div className={`text-base font-bold font-mono tracking-tight ${m.color}`}>
              {formatCurrency(m.val, { currency, compact: true })}
            </div>
            <span className="text-[9px] text-muted-foreground block truncate">
              {m.note}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
