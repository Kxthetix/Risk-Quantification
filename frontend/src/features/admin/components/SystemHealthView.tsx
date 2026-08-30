"use client";

import React from "react";
import { Activity, Server, Cpu, Database, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { useSystemHealth, useSystemDiagnostics } from "../hooks";

export function SystemHealthView() {
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const { data: diag, isLoading: diagLoading } = useSystemDiagnostics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Activity className="w-6 h-6 text-indigo-400" /> System Health & Component Diagnostics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time metrics, background queue status, database latencies, and service health probes.
        </p>
      </div>

      {/* Diagnostics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Application Version</span>
          <span className="text-lg font-bold text-slate-100 font-mono mt-1 block">
            {diag?.app_version || "2.4.0"}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">API Gateway</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
            {diag?.api_status || "ONLINE"}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Database Node</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-1 block">
            {diag?.database_status || "CONNECTED"}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 block font-medium">Real-Time WebSocket/SSE</span>
          <span className="text-lg font-bold text-indigo-400 font-mono mt-1 block">
            {diag?.websocket_status || "ACTIVE"}
          </span>
        </div>
      </div>

      {/* Subservices Health List */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" /> Backend Microservices Status
        </h3>

        {healthLoading ? (
          <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(health?.services || []).map((s) => (
              <div
                key={s.name}
                className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-200">{s.name}</span>
                    {s.version && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {s.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {s.latency_ms !== null && <span>Latency: {s.latency_ms} ms</span>}
                    <span>Error Rate: {s.error_rate_percentage}%</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === "Healthy"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {s.status === "Healthy" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
