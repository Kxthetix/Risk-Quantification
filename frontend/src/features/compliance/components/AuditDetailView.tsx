"use client";

import React from "react";
import { ComplianceAuditItem } from "../types";
import { Award, CheckCircle2, ShieldCheck, FileCheck, Layers } from "lucide-react";

interface AuditDetailViewProps {
  audit?: ComplianceAuditItem;
  isLoading?: boolean;
}

export function AuditDetailView({ audit, isLoading }: AuditDetailViewProps) {
  if (isLoading || !audit) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 text-xs">
              {audit.framework_name}
            </span>
            <h2 className="text-xl font-bold text-white">{audit.name}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-3xl">{audit.scope_description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Audit Status</div>
          <div className="text-2xl font-bold text-emerald-400">{audit.status}</div>
          <div className="text-xs text-slate-400">Conducted by {audit.auditor_name}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <span className="text-slate-400">Execution Date</span>
          <div className="font-semibold text-white mt-1">
            {new Date(audit.start_date).toLocaleDateString()}
          </div>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <span className="text-slate-400">Findings Count</span>
          <div className="font-semibold text-white mt-1">
            {audit.total_findings} ({audit.critical_findings} Critical)
          </div>
        </div>
        <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <span className="text-slate-400">Compliance Attestation</span>
          <div className="font-semibold text-emerald-400 mt-1">Certified Clean Opinion</div>
        </div>
      </div>
    </div>
  );
}
