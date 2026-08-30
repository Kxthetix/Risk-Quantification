"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuditLogs } from "../hooks";
import { getAuditExportUrl } from "../api";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import type { AuditLogItem } from "../types";

export function AuditLogTable() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: logs, isLoading } = useAuditLogs({
    action: actionFilter || undefined,
  });

  const filteredLogs = (logs || []).filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.resource_type.toLowerCase().includes(term) ||
      (log.user_email && log.user_email.toLowerCase().includes(term)) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident logs of all administrative actions, policy edits, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getAuditExportUrl("csv")}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Export CSV
          </a>
          <a
            href={getAuditExportUrl("json")}
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export JSON
          </a>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3.5 py-2 text-sm rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="ASSET_CREATED">Asset Created</option>
            <option value="RISK_CONFIG_UPDATED">Risk Config Updated</option>
            <option value="REPORT_GENERATED">Report Generated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource Target</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No matching audit events found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{log.user_email || log.user_id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {log.resource_type}{" "}
                      {log.resource_id && <span className="text-xs text-slate-500">({log.resource_id})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> {log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{log.source_ip || "127.0.0.1"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEventId(log.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-indigo-400 bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedEventId && (
        <AuditLogDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
      )}
    </div>
  );
}
