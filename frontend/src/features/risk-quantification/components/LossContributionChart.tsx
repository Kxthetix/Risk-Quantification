"use client";

import React from "react";
import { LossBreakdown } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart } from "lucide-react";

export interface LossContributionChartProps {
  breakdown?: LossBreakdown;
}

export function LossContributionChart({ breakdown }: LossContributionChartProps) {
  const { currency } = useOrganization();

  const data: LossBreakdown = breakdown || {
    currency,
    expected_loss: 48200000,
    downtime: 18400000,
    revenue_loss: 11200000,
    recovery: 7800000,
    incident_response: 3200000,
    forensics: 1600000,
    productivity: 2400000,
    data_breach: 8600000,
    regulatory: 7000000,
    customer_compensation: 2500000,
    third_party: 1500000,
    reputational: 1200000,
    percentage_contributions: {
      "System Downtime & Outages": 38.2,
      "Direct Revenue Loss": 23.2,
      "Customer Data Breach / PII": 17.8,
      "Regulatory Fines & Penalties": 14.5,
      "Recovery, Forensics & Response": 6.3,
    },
  };

  const categories = Object.entries(data.percentage_contributions).map(([name, pct]) => ({
    name,
    pct,
    amount: (data.expected_loss * pct) / 100,
  }));

  const colors = [
    "bg-amber-500",
    "bg-rose-500",
    "bg-purple-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary">
          <PieChart className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">
            Loss Factor Breakdown &amp; Financial Attribution
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Decomposition of Expected Annual Loss into underlying operational, legal, and reputational risk categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked Percentage Bar */}
        <div className="h-3.5 w-full overflow-hidden rounded-full flex bg-muted/40">
          {categories.map((cat, idx) => (
            <div
              key={cat.name}
              style={{ width: `${cat.pct}%` }}
              className={`h-full ${colors[idx % colors.length]} transition-all`}
              title={`${cat.name}: ${cat.pct}%`}
            />
          ))}
        </div>

        {/* Legend List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {categories.map((cat, idx) => (
            <div
              key={cat.name}
              className="flex items-center justify-between p-2 rounded-lg border border-border/40 bg-muted/10"
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                <span className="text-foreground font-medium text-[11px]">{cat.name}</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-foreground">
                  {formatCurrency(cat.amount, { currency, compact: true })}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1.5 font-normal">
                  ({cat.pct.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
