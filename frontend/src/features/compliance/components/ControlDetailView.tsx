"use client";

import React from "react";
import { ControlDetail } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";
import {
  ShieldCheck,
  Server,
  Briefcase,
  AlertTriangle,
  GitFork,
  FileCheck,
  ClipboardList,
  Wrench,
  Layers,
} from "lucide-react";

interface ControlDetailViewProps {
  control?: ControlDetail;
  isLoading?: boolean;
}

export function ControlDetailView({ control, isLoading }: ControlDetailViewProps) {
  if (isLoading || !control) {
    return <div className="h-96 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/30 text-sm">
                {control.code}
              </span>
              <h2 className="text-xl font-bold text-white">{control.name}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-3xl">{control.description}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Control Effectiveness</div>
            <div className="text-3xl font-extrabold text-cyan-400">
              {control.effectiveness_score.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400">{control.effectiveness_tier}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div>
            <span className="text-slate-400">Owner / Department:</span>
            <div className="font-semibold text-white mt-0.5">
              {control.owner} ({control.department})
            </div>
          </div>
          <div>
            <span className="text-slate-400">Responsible Team:</span>
            <div className="font-semibold text-white mt-0.5">{control.responsible_team}</div>
          </div>
          <div>
            <span className="text-slate-400">Associated Financial Exposure:</span>
            <div className="font-semibold text-rose-400 mt-0.5">
              {formatCurrencyINR(control.financial_exposure)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Assets, Business Services, Vulnerabilities, Attack Paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mapped Frameworks & Guidance */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            Mapped Compliance Frameworks
          </h3>
          <div className="space-y-2">
            {control.framework_mappings.map((fm, idx) => (
              <div key={idx} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 text-xs">
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{fm.framework}</span>
                  <span className="text-emerald-400 font-mono">{fm.clause}</span>
                </div>
                <div className="text-slate-400 mt-1">{fm.requirement}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapped Assets */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            Protected Assets & Services
          </h3>
          <div className="space-y-2">
            {control.mapped_assets.map((ast) => (
              <div key={ast.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{ast.name}</div>
                  <div className="text-slate-400">Criticality: {ast.criticality}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-700 text-slate-300 font-medium">
                  {ast.coverage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attack Paths & Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linked Attack Paths */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <GitFork className="w-4 h-4 text-rose-400" />
            Mitigated Attack Paths
          </h3>
          <div className="space-y-2">
            {control.mapped_attack_paths.map((p) => (
              <div key={p.id} className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/20 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-slate-400">Status: {p.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-rose-400">Risk {p.risk_score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Artifacts */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <FileCheck className="w-4 h-4 text-indigo-400" />
            Associated Evidence Artifacts
          </h3>
          <div className="space-y-2">
            {control.evidence_items.map((evi) => (
              <div key={evi.id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{evi.title}</div>
                  <div className="text-slate-400">Type: {evi.type}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {evi.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
