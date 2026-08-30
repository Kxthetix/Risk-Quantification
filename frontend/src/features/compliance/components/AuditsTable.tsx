"use client";

import React from "react";
import { ComplianceAuditItem } from "../types";
import { Award, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";

interface AuditsTableProps {
  audits?: ComplianceAuditItem[];
  isLoading?: boolean;
}

export function AuditsTable({ audits = [], isLoading }: AuditsTableProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Audit & Assessment Management
        </h3>
        <p className="text-xs text-slate-400">
          Formal third-party and internal certification audits, scope boundaries, and findings
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Audit Program</th>
              <th className="py-3 px-4">Framework</th>
              <th className="py-3 px-4">Auditor Organization</th>
              <th className="py-3 px-4">Audit Date</th>
              <th className="py-3 px-4">Total Findings</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {audits.map((aud) => {
              const isClosed = aud.status === "Closed";
              return (
                <tr key={aud.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">{aud.name}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{aud.framework_name}</td>
                  <td className="py-3 px-4 text-slate-300">{aud.auditor_name}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(aud.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-200">{aud.total_findings}</span>
                    {aud.critical_findings > 0 && (
                      <span className="ml-2 text-rose-400 font-semibold">({aud.critical_findings} Critical)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        isClosed
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {isClosed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {aud.status}
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
