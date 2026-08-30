"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, ShieldCheck, Activity } from "lucide-react";

export interface RiskQuantificationSummaryProps {
  aro?: number;
  sle?: number;
  eal?: number;
  p90?: number;
  p95?: number;
  p99?: number;
}

export function RiskQuantificationSummary({
  aro = 0.35,
  sle = 24000000,
  eal = 8400000,
  p90 = 14800000,
  p95 = 18300000,
  p99 = 26500000,
}: RiskQuantificationSummaryProps) {
  const { currency } = useOrganization();

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Calculator className="h-4 w-4 text-primary" />
          <span>FAIR Model Quantitative Risk Summary</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* ARO */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-0.5">
            <span className="text-[10px] text-muted-foreground block">Annual Frequency (ARO)</span>
            <div className="text-sm font-bold font-mono text-foreground">
              {aro.toFixed(2)}{" "}
              <span className="text-[10px] font-normal text-muted-foreground">events/yr</span>
            </div>
          </div>

          {/* SLE */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-0.5">
            <span className="text-[10px] text-muted-foreground block">Single Loss Expectancy (SLE)</span>
            <div className="text-sm font-bold font-mono text-foreground">
              {formatCurrency(sle, { currency, compact: true })}
            </div>
          </div>

          {/* EAL / ALE */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-0.5">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold">
              Expected Annual Loss (EAL)
            </span>
            <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(eal, { currency, compact: true })}
            </div>
          </div>

          {/* P90 */}
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-0.5">
            <span className="text-[10px] text-orange-500 block">P90 Tail Risk</span>
            <div className="text-sm font-bold font-mono text-orange-500">
              {formatCurrency(p90, { currency, compact: true })}
            </div>
          </div>

          {/* P95 */}
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-0.5">
            <span className="text-[10px] text-rose-500 block">P95 Catastrophic Loss</span>
            <div className="text-sm font-bold font-mono text-rose-500">
              {formatCurrency(p95, { currency, compact: true })}
            </div>
          </div>

          {/* P99 */}
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 space-y-0.5">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-semibold">
              P99 Maximum Bound
            </span>
            <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(p99, { currency, compact: true })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
