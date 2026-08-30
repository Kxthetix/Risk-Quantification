"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";

export interface PriorityActionBannerProps {
  overdueCount: number;
  criticalVulnCount: number;
  criticalAttackPathsCount: number;
  estimatedExposure: number;
  riskLevel: string;
}

export function PriorityActionBanner({
  overdueCount,
  criticalVulnCount,
  criticalAttackPathsCount,
  estimatedExposure,
  riskLevel,
}: PriorityActionBannerProps) {
  const { currency } = useOrganization();

  const isCritical = riskLevel === "CRITICAL" || overdueCount > 0 || criticalAttackPathsCount > 0;

  if (!isCritical) {
    return null;
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-amber-500/10 p-4 shadow-sm"
      role="alert"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/30">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Priority Leadership Action Required
              </span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-foreground font-medium">
              {overdueCount > 0
                ? `${overdueCount} critical remediation actions are past SLA compliance thresholds.`
                : `${criticalAttackPathsCount} viable adversary attack paths detected traversing internet-exposed assets.`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total unmitigated financial risk exposure:{" "}
              <strong className="text-rose-500 font-bold">
                {formatCurrency(estimatedExposure, { currency, compact: true })}
              </strong>
              . Remediating these choke points eliminates up to 64% of lateral movement attack paths.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <Link href="/remediation">
              <span>Review Overdue Remediations</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
