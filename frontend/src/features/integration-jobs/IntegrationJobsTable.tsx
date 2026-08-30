"use client";

import React from "react";
import { Cpu, CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { useBackgroundJobs, useRetryBackgroundJob } from "@/features/admin";

export function IntegrationJobsTable() {
  const { data: jobs, isLoading } = useBackgroundJobs();
  const retryMutation = useRetryBackgroundJob();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-indigo-400" /> Ingestion & Correlation Worker Queue
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor asynchronous workers handling stream validation, CVE deduplication, asset correlation, and risk recalculation.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Task Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(jobs || []).map((j) => (
                <tr key={j.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-100 block">{j.job_type}</span>
                    <span className="text-xs text-slate-500 font-mono">{j.id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        j.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : j.status === "FAILED"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {j.status === "COMPLETED" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : j.status === "FAILED" ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>{j.progress_percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            j.status === "FAILED" ? "bg-rose-500" : "bg-indigo-500"
                          }`}
                          style={{ width: `${j.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {j.attempts} / {j.max_attempts}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {j.started_at ? new Date(j.started_at).toLocaleTimeString() : "Pending"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {j.status === "FAILED" && (
                      <button
                        onClick={() => retryMutation.mutate(j.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
