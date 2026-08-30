"use client";

import React from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils/number";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, ShieldCheck, ArrowRight } from "lucide-react";

export interface RemediationSummaryProps {
  open: number;
  overdue: number;
  completed: number;
  verified?: number;
  totalLossReduction?: number;
}

export function RemediationSummary({
  open = 184,
  overdue = 37,
  completed = 426,
  verified = 312,
  totalLossReduction = 4200000,
}: RemediationSummaryProps) {
  const { currency } = useOrganization();

  const total = open + completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* 4-Stat Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Open Tasks</span>
          <div className="text-xl font-bold text-foreground">{formatNumber(open)}</div>
        </div>

        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-1">
          <span className="text-[11px] text-rose-500 font-medium">Overdue SLA</span>
          <div className="text-xl font-bold text-rose-500">{formatNumber(overdue)}</div>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-1">
          <span className="text-[11px] text-emerald-500 font-medium">Completed</span>
          <div className="text-xl font-bold text-emerald-500">{formatNumber(completed)}</div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">SLA Rate</span>
          <div className="text-xl font-bold text-primary">{completionRate}%</div>
        </div>
      </div>

      {/* SLA Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-muted-foreground">Cumulative Remediation Progress</span>
          <span className="font-semibold text-foreground">{completionRate}% of target</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Financial Exposure Avoided Callout */}
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground">
            Modeled loss avoided through completed remediations:
          </span>
        </div>
        <strong className="text-emerald-500 font-mono font-bold">
          {formatCurrency(totalLossReduction, { currency, compact: true })}
        </strong>
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-border/40 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
          <Link href="/remediation">
            <span>Manage Remediation Pipeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
