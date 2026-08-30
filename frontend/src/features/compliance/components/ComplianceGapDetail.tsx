"use client";

import React from "react";
import { ComplianceGapDetail as ComplianceGapDetailType } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";
import { AlertOctagon, GitFork, Server, Wrench, ShieldAlert } from "lucide-react";

interface ComplianceGapDetailProps {
  gap?: ComplianceGapDetailType;
  isLoading?: boolean;
}

export function ComplianceGapDetail({ gap, isLoading }: ComplianceGapDetailProps) {
  if (isLoading || !gap) {
    return <div className="h-96 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/30 text-xs">
                {gap.severity} GAP
              </span>
              <h2 className="text-xl font-bold text-white">{gap.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-3xl">{gap.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Financial Risk Exposure</div>
            <div className="text-3xl font-extrabold text-rose-400">
              {formatCurrencyINR(gap.financial_exposure)}
            </div>
            <div className="text-xs text-slate-400">P95 Loss: {formatCurrencyINR(gap.p95_loss)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div>
            <span className="text-slate-400">Framework Requirement:</span>
            <div className="font-semibold text-white mt-0.5">{gap.requirement}</div>
          </div>
          <div>
            <span className="text-slate-400">Root Cause:</span>
            <div className="font-semibold text-amber-400 mt-0.5">{gap.root_cause}</div>
          </div>
          <div>
            <span className="text-slate-400">Remediation Owner:</span>
            <div className="font-semibold text-white mt-0.5">{gap.owner}</div>
          </div>
        </div>
      </div>

      {/* Affected Attack Paths & Remediation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <GitFork className="w-4 h-4 text-rose-400" />
            Attack Paths Enabled by this Gap
          </h3>
          <div className="space-y-2">
            {gap.affected_attack_paths.map((p) => (
              <div key={p.id} className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{p.name}</span>
                <span className="font-mono font-bold text-rose-400">Risk {p.risk_score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-emerald-400" />
            Remediation Actions & Corrective Plan
          </h3>
          <div className="space-y-2">
            {gap.remediation_actions.map((rem) => (
              <div key={rem.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{rem.action}</div>
                  <div className="text-slate-400">Owner: {rem.owner}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {rem.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
