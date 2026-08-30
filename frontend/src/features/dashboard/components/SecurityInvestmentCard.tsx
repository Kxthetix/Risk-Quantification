"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, PiggyBank, ArrowRight } from "lucide-react";

export interface SecurityInvestmentCardProps {
  securityInvestment: number;
  expectedLossReduction: number;
  modeledRiskReduction?: number;
  roi: number;
  riskReductionPerRupee?: number;
}

export function SecurityInvestmentCard({
  securityInvestment = 2500000,
  expectedLossReduction = 4800000,
  modeledRiskReduction = 0.38,
  roi = 192,
  riskReductionPerRupee = 1.92,
}: SecurityInvestmentCardProps) {
  const { currency } = useOrganization();

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* 4-Stat Investment Efficiency Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Annual Investment</span>
          <div className="text-lg font-bold text-foreground">
            {formatCurrency(securityInvestment, { currency, compact: true })}
          </div>
        </div>

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 space-y-1">
          <span className="text-[11px] text-emerald-500 font-medium">Expected Loss Avoided</span>
          <div className="text-lg font-bold text-emerald-500">
            {formatCurrency(expectedLossReduction, { currency, compact: true })}
          </div>
        </div>

        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 space-y-1">
          <span className="text-[11px] text-blue-500 font-medium">Risk Reduction</span>
          <div className="text-lg font-bold text-blue-500">
            {(modeledRiskReduction * 100).toFixed(0)}%
          </div>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 space-y-1">
          <span className="text-[11px] text-primary font-medium">Modeled ROI</span>
          <div className="text-lg font-bold text-primary">{roi}%</div>
        </div>
      </div>

      {/* Efficiency Ratio Banner */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <PiggyBank className="h-4 w-4 text-emerald-500" />
            <span>Defensive Capital Efficiency</span>
          </span>
          <span className="font-mono font-bold text-emerald-500 text-[11px]">
            {riskReductionPerRupee.toFixed(2)}x Return Multiplier
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Every monetary unit allocated to prioritized defensive controls yields{" "}
          <strong className="text-foreground">{riskReductionPerRupee.toFixed(2)}x</strong> in annualized monetary loss prevention.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-border/40 flex justify-end">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
          <Link href="/investments">
            <span>Investment Optimization</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
