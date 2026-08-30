"use client";

import React from "react";
import { Cpu, RefreshCw, XOctagon, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useBackgroundJobs, useRetryBackgroundJob, useCancelBackgroundJob } from "../hooks";

export function BackgroundJobsView() {
  const { data: jobs, isLoading } = useBackgroundJobs();
  const retryMutation = useRetryBackgroundJob();
  const cancelMutation = useCancelBackgroundJob();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Cpu className="w-6 h-6 text-indigo-400" /> Background Worker Jobs
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor asynchronous task queues, progress completion, error logs, and retry budgets.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Job Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Error Context</th>
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
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {j.attempts} / {j.max_attempts}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {j.error_message ? (
                      <span className="text-rose-400">
                        [{j.error_code}] {j.error_message}
                      </span>
                    ) : (
                      <span className="text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {j.status === "FAILED" && (
                      <button
                        onClick={() => retryMutation.mutate(j.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                    {j.status === "QUEUED" && (
                      <button
                        onClick={() => cancelMutation.mutate(j.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                      >
                        <XOctagon className="w-3 h-3" /> Cancel
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
