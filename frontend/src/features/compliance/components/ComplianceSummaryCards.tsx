"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Layers,
  FileCheck,
  AlertOctagon,
  Clock,
  Banknote,
  Award,
} from "lucide-react";
import { ComplianceSummary } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";

interface ComplianceSummaryCardsProps {
  summary?: ComplianceSummary;
  isLoading?: boolean;
}

export function ComplianceSummaryCards({ summary, isLoading }: ComplianceSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-800/40 rounded-xl border border-slate-700/50" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Overall Compliance",
      value: `${summary.overall_compliance_pct.toFixed(1)}%`,
      sub: `${summary.frameworks_count} Frameworks Active`,
      icon: Award,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    {
      title: "Control Coverage",
      value: `${summary.control_coverage_pct.toFixed(1)}%`,
      sub: "Asset & Service Perimeter",
      icon: Layers,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
    },
    {
      title: "Implemented Controls",
      value: `${summary.implemented_controls_count} / ${summary.total_controls}`,
      sub: `${Math.round((summary.implemented_controls_count / summary.total_controls) * 100)}% Implemented`,
      icon: ShieldCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/30",
    },
    {
      title: "Open Gaps",
      value: summary.open_gaps_count.toString(),
      sub: `${summary.critical_gaps_count} Critical Deficiencies`,
      icon: ShieldAlert,
      color: summary.open_gaps_count > 0 ? "text-amber-400" : "text-emerald-400",
      bg: summary.open_gaps_count > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30",
    },
    {
      title: "Critical Gaps",
      value: summary.critical_gaps_count.toString(),
      sub: "Immediate Remediation Required",
      icon: AlertOctagon,
      color: summary.critical_gaps_count > 0 ? "text-rose-400" : "text-slate-400",
      bg: summary.critical_gaps_count > 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-800/40 border-slate-700/50",
    },
    {
      title: "Overdue Assessments",
      value: summary.overdue_assessments_count.toString(),
      sub: "Past Scheduled Cadence",
      icon: Clock,
      color: summary.overdue_assessments_count > 0 ? "text-amber-400" : "text-slate-400",
      bg: summary.overdue_assessments_count > 0 ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-800/40 border-slate-700/50",
    },
    {
      title: "Evidence Coverage",
      value: `${summary.evidence_coverage_pct.toFixed(1)}%`,
      sub: "Artifacts Verified & Valid",
      icon: FileCheck,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/30",
    },
    {
      title: "Compliance Risk Exposure",
      value: formatCurrencyINR(summary.total_compliance_risk_exposure),
      sub: "Estimated Financial Exposure",
      icon: Banknote,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-4 rounded-xl border ${c.bg} backdrop-blur-sm transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{c.title}</span>
              <Icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className={`text-2xl font-bold mt-2 ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-400 mt-1 truncate">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
