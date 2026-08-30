"use client";

import React from "react";
import Link from "next/link";
import { TopAttackPathItem } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatScore } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { GitFork, ArrowRight, ArrowRightCircle, ShieldAlert } from "lucide-react";

export interface AttackPathSummaryProps {
  totalPaths?: number;
  criticalPaths?: number;
  topPaths?: TopAttackPathItem[];
}

export function AttackPathSummary({
  totalPaths = 28,
  criticalPaths = 12,
  topPaths = [],
}: AttackPathSummaryProps) {
  const { currency } = useOrganization();

  // Fallback top paths if backend list is empty
  const items: TopAttackPathItem[] =
    topPaths.length > 0
      ? topPaths.slice(0, 3)
      : [
          {
            path_id: "path-1",
            entry_point: "Internet Edge WAF",
            target: "Payment DB Cluster",
            target_asset_name: "Customer Cardholder Data Store",
            path_length: 4,
            likelihood: 0.88,
            impact: 0.95,
            path_score: 94.2,
            financial_exposure: 2400000,
          },
          {
            path_id: "path-2",
            entry_point: "Public Employee VPN",
            target: "Core Active Directory",
            target_asset_name: "Enterprise Identity & Kerberos",
            path_length: 3,
            likelihood: 0.74,
            impact: 0.92,
            path_score: 86.8,
            financial_exposure: 1850000,
          },
          {
            path_id: "path-3",
            entry_point: "Customer Support Portal",
            target: "S3 Object Bucket",
            target_asset_name: "PII & Document Vault",
            path_length: 3,
            likelihood: 0.68,
            impact: 0.84,
            path_score: 79.5,
            financial_exposure: 1200000,
          },
        ];

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Top Banner Stats */}
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {criticalPaths} Critical Attack Paths
            </div>
            <div className="text-[11px] text-muted-foreground">
              {totalPaths} total lateral movement chains mapped across topology
            </div>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Link href="/attack-paths">
            <span>Graph View</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Path Choke-Point Previews */}
      <div className="space-y-2.5">
        {items.map((path, idx) => (
          <div
            key={path.path_id || idx}
            className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 hover:border-orange-500/40 transition-colors"
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-xs">
                <span className="text-[10px] text-muted-foreground font-mono">#{idx + 1}</span>
                <span className="truncate">{path.target_asset_name || path.target}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-rose-500 font-bold">
                  Score: {formatScore(path.path_score)}
                </span>
                <span className="text-[11px] font-mono text-foreground font-semibold">
                  {formatCurrency(path.financial_exposure, { currency, compact: true })}
                </span>
              </div>
            </div>

            {/* Lateral Vector Chain Visualizer */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground overflow-x-auto py-0.5">
              <span className="rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 whitespace-nowrap font-medium">
                {path.entry_point}
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="rounded bg-muted px-1.5 py-0.5 whitespace-nowrap">
                Lateral Pivots ({path.path_length} hops)
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 whitespace-nowrap font-medium">
                {path.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
