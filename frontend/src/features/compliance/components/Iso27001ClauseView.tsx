"use client";

import React from "react";
import { FrameworkClauseItem } from "../types";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";

interface Iso27001ClauseViewProps {
  clauses?: FrameworkClauseItem[];
}

export function Iso27001ClauseView({ clauses = [] }: Iso27001ClauseViewProps) {
  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">ISO/IEC 27001:2022 Clauses & Annex A Structure</h3>
          <p className="text-xs text-slate-400">
            Mandatory ISMS Management Clauses (4–10) and Annex A Control Categories
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clauses.map((clause) => {
          const isCompliant = clause.status === "COMPLIANT";
          const isCritical = clause.status === "CRITICAL_GAPS";
          return (
            <div
              key={clause.clause_id}
              className={`p-4 rounded-xl border transition-all ${
                isCompliant
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : isCritical
                  ? "bg-rose-500/5 border-rose-500/30"
                  : "bg-amber-500/5 border-amber-500/20"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {clause.clause_id}
                  </span>
                  <h4 className="text-sm font-semibold text-white mt-2">{clause.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{clause.description}</p>
                </div>
                {isCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : isCritical ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-slate-400">
                  Implemented: <span className="text-white font-semibold">{clause.implemented_controls}/{clause.total_controls}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCompliant ? "bg-emerald-500" : isCritical ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${clause.compliance_pct}%` }}
                    />
                  </div>
                  <span className="font-semibold text-white">{clause.compliance_pct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
