"use client";

import React from "react";
import { ComplianceTrendPoint } from "../types";
import { TrendingUp, ShieldCheck, FileCheck, Layers } from "lucide-react";

interface ComplianceTrendChartProps {
  trends?: ComplianceTrendPoint[];
  isLoading?: boolean;
}

export function ComplianceTrendChart({ trends = [], isLoading }: ComplianceTrendChartProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Compliance & Controls Maturity Progression
          </h3>
          <p className="text-xs text-slate-400">
            Historical 90-day trajectory of compliance scoring, control effectiveness, and gap reduction
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {trends.map((pt, i) => (
          <div
            key={i}
            className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-3"
          >
            <div className="text-xs font-mono text-slate-400">
              {new Date(pt.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
            <div>
              <div className="text-xs text-slate-400">Compliance Score</div>
              <div className="text-2xl font-bold text-emerald-400">
                {pt.compliance_score.toFixed(1)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-700/50">
              <div>
                <span className="text-slate-400">Control Eff:</span>
                <div className="font-semibold text-cyan-400">{pt.control_effectiveness}%</div>
              </div>
              <div>
                <span className="text-slate-400">Open Gaps:</span>
                <div className="font-semibold text-amber-400">{pt.open_gaps}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
