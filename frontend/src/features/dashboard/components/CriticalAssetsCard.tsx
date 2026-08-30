"use client";

import React from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils/number";
import { Button } from "@/components/ui/button";
import { Globe, Server, ArrowRight, ShieldCheck } from "lucide-react";

export interface CriticalAssetsCardProps {
  totalAssets: number;
  criticalAssets: number;
  highRiskAssets?: number;
  internetFacing?: number;
}

export function CriticalAssetsCard({
  totalAssets = 1248,
  criticalAssets = 84,
  highRiskAssets = 216,
  internetFacing = 42,
}: CriticalAssetsCardProps) {
  const mediumAssets = Math.max(0, totalAssets - criticalAssets - highRiskAssets - 518);
  const lowAssets = Math.max(0, totalAssets - criticalAssets - highRiskAssets - mediumAssets);

  const tiers = [
    { label: "Critical", count: criticalAssets, color: "bg-rose-500", text: "text-rose-500" },
    { label: "High", count: highRiskAssets, color: "bg-orange-500", text: "text-orange-500" },
    { label: "Medium", count: mediumAssets || 430, color: "bg-amber-500", text: "text-amber-500" },
    { label: "Low", count: lowAssets || 518, color: "bg-emerald-500", text: "text-emerald-500" },
  ];

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Top Counts Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-0.5">
          <span className="text-[11px] text-muted-foreground font-medium">Total Inventory</span>
          <div className="text-xl font-bold text-foreground">{formatNumber(totalAssets)}</div>
        </div>

        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 space-y-0.5">
          <span className="text-[11px] text-rose-500 font-medium">Critical Tier</span>
          <div className="text-xl font-bold text-rose-500">{formatNumber(criticalAssets)}</div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-0.5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Globe className="h-3 w-3 text-orange-500" />
            <span>Internet-Facing</span>
          </div>
          <div className="text-xl font-bold text-orange-500">{formatNumber(internetFacing)}</div>
        </div>
      </div>

      {/* Asset Tier Breakdown Progress Bars */}
      <div className="space-y-2 pt-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Risk Posture Breakdown
        </div>
        <div className="space-y-1.5">
          {tiers.map((tier) => {
            const percentage = totalAssets > 0 ? (tier.count / totalAssets) * 100 : 0;
            return (
              <div key={tier.label} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-foreground">{tier.label}</span>
                  <span className={`font-mono font-bold ${tier.text}`}>
                    {formatNumber(tier.count)}{" "}
                    <span className="text-[10px] text-muted-foreground">({percentage.toFixed(0)}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={`h-full rounded-full ${tier.color}`}
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-border/40 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
          <Link href="/assets">
            <span>Explore Asset Inventory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
