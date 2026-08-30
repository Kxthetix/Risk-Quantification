"use client";

import React from "react";
import { Grid, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

export function ComplianceRiskHeatmap() {
  const cells = [
    { effectiveness: "High (80-100%)", attackRisk: "Low (0-30)", count: 28, status: "Secure", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { effectiveness: "High (80-100%)", attackRisk: "Medium (30-70)", count: 14, status: "Monitored", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    { effectiveness: "High (80-100%)", attackRisk: "Critical (70-100)", count: 4, status: "Attention", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" },

    { effectiveness: "Medium (50-79%)", attackRisk: "Low (0-30)", count: 12, status: "Acceptable", bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
    { effectiveness: "Medium (50-79%)", attackRisk: "Medium (30-70)", count: 18, status: "Elevated", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { effectiveness: "Medium (50-79%)", attackRisk: "Critical (70-100)", count: 9, status: "Priority Remediation", bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" },

    { effectiveness: "Low (0-49%)", attackRisk: "Low (0-30)", count: 3, status: "Minor Gap", bg: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
    { effectiveness: "Low (0-49%)", attackRisk: "Medium (30-70)", count: 6, status: "Critical Vulnerability", bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
    { effectiveness: "Low (0-49%)", attackRisk: "Critical (70-100)", count: 7, status: "IMMEDIATE EMERGENCY", bg: "bg-rose-600/30 text-rose-400 border-rose-500 font-extrabold animate-pulse" },
  ];

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 backdrop-blur-md space-y-4">
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Grid className="w-5 h-5 text-amber-400" />
          Control Effectiveness vs. Attack Path Risk Heatmap
        </h3>
        <p className="text-xs text-slate-400">
          Identifies high-urgency controls where low defensive effectiveness coincides with active high-risk attack paths
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        {cells.map((c, i) => (
          <div
            key={i}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${c.bg}`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">{c.attackRisk} Attack Risk</div>
              <div className="font-mono text-2xl font-black mt-1">{c.count}</div>
              <div className="text-[11px] font-semibold mt-0.5">{c.status}</div>
            </div>
            <div className="text-[10px] opacity-70 mt-2">Defensive Score: {c.effectiveness}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
