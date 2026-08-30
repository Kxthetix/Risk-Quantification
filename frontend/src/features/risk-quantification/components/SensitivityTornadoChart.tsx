"use client";

import React from "react";
import { SensitivityTornadoItem } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export interface SensitivityTornadoChartProps {
  items?: SensitivityTornadoItem[];
}

export function SensitivityTornadoChart({ items = [] }: SensitivityTornadoChartProps) {
  const { currency } = useOrganization();

  const data: SensitivityTornadoItem[] =
    items.length > 0
      ? items
      : [
          {
            variable_name: "Outage Downtime Duration",
            variable_key: "downtime",
            baseline_value: 12,
            low_impact_eal: 4200000,
            high_impact_eal: 16800000,
            swing_amount: 12600000,
            unit: "Hours",
          },
          {
            variable_name: "Annual Occurrence Frequency (ARO)",
            variable_key: "frequency",
            baseline_value: 0.35,
            low_impact_eal: 3100000,
            high_impact_eal: 12400000,
            swing_amount: 9300000,
            unit: "Events / Year",
          },
          {
            variable_name: "PII Records Compromised",
            variable_key: "records",
            baseline_value: 25000,
            low_impact_eal: 5200000,
            high_impact_eal: 11800000,
            swing_amount: 6600000,
            unit: "Records",
          },
          {
            variable_name: "Third-Party Incident Forensics Rate",
            variable_key: "forensics",
            baseline_value: 2500,
            low_impact_eal: 6800000,
            high_impact_eal: 9200000,
            swing_amount: 2400000,
            unit: "₹ / Hour",
          },
        ];

  const maxSwing = Math.max(...data.map((d) => d.swing_amount), 1);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary">
          <BarChart2 className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">
            Sensitivity Analysis &amp; Tornado Impact Chart
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Identifies the most sensitive financial risk drivers where uncertainties exert maximum swing on Expected Annual Loss.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {data.map((item) => {
            const swingWidthPct = (item.swing_amount / maxSwing) * 100;

            return (
              <div key={item.variable_key} className="space-y-1 text-xs">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-foreground font-semibold">{item.variable_name}</span>
                  <span className="font-mono text-muted-foreground">
                    Swing: ±{formatCurrency(item.swing_amount / 2, { currency, compact: true })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-16 font-mono text-[10px] text-emerald-500 text-right">
                    {formatCurrency(item.low_impact_eal, { currency, compact: true })}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted/40 flex items-center justify-center">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-500"
                      style={{ width: `${swingWidthPct}%` }}
                    />
                  </div>
                  <span className="w-16 font-mono text-[10px] text-rose-500 text-left">
                    {formatCurrency(item.high_impact_eal, { currency, compact: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/40 pt-2 font-mono">
          <span className="text-emerald-500">← Minimum Parameter Bound</span>
          <span>Baseline Model EAL</span>
          <span className="text-rose-500">Maximum Parameter Bound →</span>
        </div>
      </CardContent>
    </Card>
  );
}
