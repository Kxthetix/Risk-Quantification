"use client";

import React from "react";
import { useComplianceSummary, useComplianceCyberRiskMap, useComplianceTrends } from "@/features/compliance/hooks";
import { ComplianceSummaryCards } from "@/features/compliance/components/ComplianceSummaryCards";
import { ComplianceRiskHeatmap } from "@/features/compliance/components/ComplianceRiskHeatmap";
import { ComplianceTrendChart } from "@/features/compliance/components/ComplianceTrendChart";
import { Banknote } from "lucide-react";

export default function ComplianceRiskPage() {
  const { data: summary, isLoading: isSummaryLoading } = useComplianceSummary();
  const { data: trends, isLoading: isTrendsLoading } = useComplianceTrends();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Banknote className="w-6 h-6 text-rose-400" />
          Compliance Risk & Financial Exposure
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          FAIR-aligned financial quantification of non-compliance, regulatory penalties, and breach loss
        </p>
      </div>

      <ComplianceSummaryCards summary={summary} isLoading={isSummaryLoading} />
      <ComplianceRiskHeatmap />
      <ComplianceTrendChart trends={trends} isLoading={isTrendsLoading} />
    </div>
  );
}
