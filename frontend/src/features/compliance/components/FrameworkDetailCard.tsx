"use client";

import React from "react";
import { FrameworkDetail } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";
import { ShieldCheck, AlertCircle, FileCheck, Layers, Award } from "lucide-react";

interface FrameworkDetailCardProps {
  framework?: FrameworkDetail;
  isLoading?: boolean;
}

export function FrameworkDetailCard({ framework, isLoading }: FrameworkDetailCardProps) {
  if (isLoading || !framework) {
    return <div className="h-48 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{framework.name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              v{framework.version}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{framework.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Framework Compliance Score</div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {framework.compliance_pct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Controls</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{framework.total_controls}</div>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Implemented</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{framework.implemented_controls}</div>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Open Gaps</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">{framework.open_gaps_count}</div>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Evidence Coverage</span>
            <FileCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-400 mt-1">
            {framework.evidence_coverage_pct.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
