"use client";

import React from "react";
import { FrameworkItem } from "../types";
import { Layers, ShieldCheck, AlertTriangle } from "lucide-react";

interface FrameworkComparisonViewProps {
  frameworks?: FrameworkItem[];
  isLoading?: boolean;
}

export function FrameworkComparisonView({ frameworks = [], isLoading }: FrameworkComparisonViewProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-6">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Side-by-Side Framework Benchmark & Comparison
        </h3>
        <p className="text-xs text-slate-400">
          Compare compliance maturity scores, control coverage, and open gaps across active standards
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks.map((f) => (
          <div key={f.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">{f.name}</span>
              <span className="font-mono text-xs text-slate-400">v{f.version}</span>
            </div>

            <div>
              <div className="text-xs text-slate-400">Compliance Score</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
                {f.compliance_pct.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/50">
              <div>
                <span className="text-slate-400">Implemented:</span>
                <div className="font-semibold text-white">{f.implemented_controls} / {f.total_controls}</div>
              </div>
              <div>
                <span className="text-slate-400">Open Gaps:</span>
                <div className="font-semibold text-amber-400">{f.gaps_count}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
