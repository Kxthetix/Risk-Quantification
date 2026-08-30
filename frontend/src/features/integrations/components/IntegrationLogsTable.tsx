"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import type { IntegrationLogItem } from "../types";

export function IntegrationLogsTable({ logs }: { logs: IntegrationLogItem[] }) {
  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          Execution & Synchronization Logs
        </h3>
        <span className="text-xs text-slate-500 font-mono">{logs.length} runs recorded</span>
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No synchronization logs available yet. Trigger a sync to record telemetry runs.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850/80 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Operation</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Accepted / Received</th>
                <th className="px-3 py-2">Created / Updated</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-indigo-400">{log.operation}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : log.status === "PARTIAL"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {log.status === "SUCCESS" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : log.status === "PARTIAL" ? (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      ) : (
                        <XCircle className="w-2.5 h-2.5" />
                      )}
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300 font-mono">
                    {log.records_accepted} / {log.records_received}
                  </td>
                  <td className="px-3 py-2 text-slate-400 font-mono">
                    +{log.records_created} / ~{log.records_updated}
                  </td>
                  <td className="px-3 py-2 text-slate-400 font-mono">{log.duration_ms} ms</td>
                  <td className="px-3 py-2 text-slate-400 text-[11px] truncate max-w-[200px]">
                    {log.error_message ? (
                      <span className="text-rose-400">{log.error_message}</span>
                    ) : (
                      "Clean run"
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
