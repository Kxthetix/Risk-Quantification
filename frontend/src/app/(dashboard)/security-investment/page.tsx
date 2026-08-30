"use client";

import React from "react";
import Link from "next/link";
import { SecurityInvestmentView } from "@/features/risk-quantification/components/SecurityInvestmentView";
import { FinancialImpactWaterfall } from "@/features/risk-quantification/components/FinancialImpactWaterfall";
import { ArrowLeft, TrendingUp, ShieldCheck } from "lucide-react";

export default function SecurityInvestmentPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risk-quantification"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Cyber Defense Investment &amp; ROSI Optimizer</h1>
          <p className="text-xs text-muted-foreground">
            Optimize cybersecurity budget by quantifying Return on Security Investment (ROSI %) and residual loss reduction.
          </p>
        </div>
      </div>

      <SecurityInvestmentView />

      <FinancialImpactWaterfall />
    </div>
  );
}
