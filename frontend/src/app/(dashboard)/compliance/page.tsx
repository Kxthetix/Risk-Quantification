"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useComplianceSummary,
  useComplianceFrameworks,
  useComplianceGaps,
  useComplianceCyberRiskMap,
} from "@/features/compliance/hooks";
import { ComplianceSummaryCards } from "@/features/compliance/components/ComplianceSummaryCards";
import { FrameworksTable } from "@/features/compliance/components/FrameworksTable";
import { ComplianceGapsTable } from "@/features/compliance/components/ComplianceGapsTable";
import { ComplianceCyberRiskMap } from "@/features/compliance/components/ComplianceCyberRiskMap";
import { ComplianceRiskHeatmap } from "@/features/compliance/components/ComplianceRiskHeatmap";
import { ComplianceCalendarView } from "@/features/compliance/components/ComplianceCalendarView";
import { ExecutiveComplianceReportModal } from "@/features/compliance/components/ExecutiveComplianceReportModal";
import {
  ShieldCheck,
  FileText,
  GitFork,
  Layers,
  Award,
  Calendar,
  AlertTriangle,
} from "lucide-react";

export default function ComplianceDashboardPage() {
  const { data: summary, isLoading: isSummaryLoading } = useComplianceSummary();
  const { data: frameworks, isLoading: isFrameworksLoading } = useComplianceFrameworks();
  const { data: gaps, isLoading: isGapsLoading } = useComplianceGaps();
  const { data: riskMap, isLoading: isRiskMapLoading } = useComplianceCyberRiskMap();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Compliance & Security Controls
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative continuous compliance monitoring, ISO/IEC 27001 mapping, and cyber-risk quantification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/compliance/risk-map"
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <GitFork className="w-4 h-4" />
            Risk Map
          </Link>
          <Link
            href="/compliance/control-library"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4" />
            Control Library
          </Link>
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Executive Report
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <ComplianceSummaryCards summary={summary} isLoading={isSummaryLoading} />

      {/* Frameworks Table */}
      <FrameworksTable frameworks={frameworks} isLoading={isFrameworksLoading} />

      {/* Compliance-to-Cyber Risk Chain Mapping */}
      <ComplianceCyberRiskMap data={riskMap} isLoading={isRiskMapLoading} />

      {/* 2D Heatmap & Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplianceRiskHeatmap />
        <ComplianceCalendarView />
      </div>

      {/* Critical Gaps Table */}
      <ComplianceGapsTable gaps={gaps} isLoading={isGapsLoading} />

      {/* Executive Report Modal */}
      <ExecutiveComplianceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        summary={summary}
        frameworks={frameworks}
      />
    </div>
  );
}
