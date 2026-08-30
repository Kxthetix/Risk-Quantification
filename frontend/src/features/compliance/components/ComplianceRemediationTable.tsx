"use client";

import React from "react";
import { ComplianceRemediationItem } from "../types";
import { Wrench, CheckCircle2, Clock, TrendingDown } from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils/formatters";

interface ComplianceRemediationTableProps {
  remediations?: ComplianceRemediationItem[];
  isLoading?: boolean;
}

export function ComplianceRemediationTable({ remediations = [], isLoading }: ComplianceRemediationTableProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-400" />
          Compliance Remediation & Corrective Actions
        </h3>
        <p className="text-xs text-slate-400">
          Track corrective actions, task owners, and projected financial risk reduction
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Corrective Action</th>
              <th className="py-3 px-4">Control</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Projected Reduction</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {remediations.map((rem) => {
              const isDone = rem.status === "Completed" || rem.status === "Verified";
              return (
                <tr key={rem.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 max-w-sm font-semibold text-white">{rem.finding}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {rem.control_code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{rem.owner}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        rem.priority === "Critical"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {rem.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(rem.due_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 font-semibold text-emerald-400">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>-{rem.risk_reduction_pct}% ({formatCurrencyINR(rem.financial_reduction)})</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        isDone
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {rem.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
