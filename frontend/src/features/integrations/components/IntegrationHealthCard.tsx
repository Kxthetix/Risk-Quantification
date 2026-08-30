"use client";

import React from "react";
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, ArrowDown } from "lucide-react";
import type { IntegrationItem } from "../types";

export function IntegrationHealthCard({ integration }: { integration: IntegrationItem }) {
  const isHealthy = integration.status === "CONNECTED";
  const isDegraded = integration.status === "DEGRADED";

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-400" />
          Health & Posture Impact
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            isHealthy
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : isDegraded
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {isHealthy ? "Healthy Posture" : isDegraded ? "Degraded Sync" : "Critical Disruption"}
        </span>
      </div>

      {/* Freshness metrics */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-800">
          <span className="text-slate-400">Data Freshness</span>
          <span className="font-mono text-slate-200">
            {integration.last_sync_at ? "Fresh (< 1 hr)" : "No telemetry"}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-800">
          <span className="text-slate-400">Sync Error Rate</span>
          <span className="font-mono text-slate-200">
            {integration.status === "FAILED" ? "100%" : integration.status === "DEGRADED" ? "14.2%" : "0.0%"}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-800">
          <span className="text-slate-400">Downstream Pipeline</span>
          <span className="font-mono text-emerald-400">Active</span>
        </div>
      </div>

      {/* Dependency & Impact Alert */}
      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Downstream Impact Chain
        </span>
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Telemetry Ingestion ({integration.name})</span>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <ArrowDown className="w-3 h-3 text-slate-600" />
            <span>Canonical Asset & Vulnerability Correlation</span>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <ArrowDown className="w-3 h-3 text-slate-600" />
            <span>Risk Engine & Financial Exposure Recalculation</span>
          </div>
        </div>

        {integration.status !== "CONNECTED" && (
          <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Disruption in this connector reduces real-time risk visibility and increases uncertainty bounds in Monte Carlo loss distributions.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
