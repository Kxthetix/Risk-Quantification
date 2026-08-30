"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sliders,
  FileText,
  Trash2,
  Play,
  Activity,
  Check,
  Search,
} from "lucide-react";
import {
  useIntegrations,
  useTestConnection,
  useSyncIntegration,
  useDeleteIntegration,
} from "../hooks";
import type { IntegrationItem } from "../types";

export function IntegrationTable() {
  const { data: integrations, isLoading } = useIntegrations();
  const testMutation = useTestConnection();
  const syncMutation = useSyncIntegration();
  const deleteMutation = useDeleteIntegration();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const handleTest = (id: string) => {
    setTestingId(id);
    testMutation.mutate(
      { id },
      {
        onSuccess: (res) => {
          setTestNotice((prev) => ({
            ...prev,
            [id]: `${res.status}: ${res.message} (${res.latency_ms}ms)`,
          }));
          setTestingId(null);
          setTimeout(() => {
            setTestNotice((prev) => {
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
          }, 4000);
        },
        onError: () => {
          setTestNotice((prev) => ({ ...prev, [id]: "Connection request failed" }));
          setTestingId(null);
        },
      }
    );
  };

  const handleSync = (id: string) => {
    setSyncingId(id);
    syncMutation.mutate(
      { id, payload: { sync_mode: "INCREMENTAL" } },
      {
        onSuccess: (res) => {
          setTestNotice((prev) => ({
            ...prev,
            [id]: `Sync ${res.status}: Accepted ${res.records_accepted} records.`,
          }));
          setSyncingId(null);
          setTimeout(() => {
            setTestNotice((prev) => {
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
          }, 4000);
        },
        onError: () => {
          setSyncingId(null);
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove integration "${name}"? Remote telemetry ingestion will stop.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = (integrations || []).filter((i) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.category.toLowerCase().includes(term) ||
      i.connector_type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Connector</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Last Sync</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No configured integrations found. Explore the catalog to connect tools.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/integrations/${item.id}`}
                        className="font-semibold text-slate-100 hover:text-indigo-400 transition-colors block"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono">{item.connector_type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "CONNECTED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "DEGRADED"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {item.status === "CONNECTED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : item.status === "DEGRADED" ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {item.status}
                      </span>
                      {testNotice[item.id] && (
                        <span className="text-[11px] text-indigo-400 block mt-1">
                          {testNotice[item.id]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{item.sync_frequency}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {item.last_sync_at ? new Date(item.last_sync_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleTest(item.id)}
                        disabled={testingId === item.id}
                        title="Test Connection"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-indigo-400 hover:bg-slate-750 border border-slate-700 transition-colors"
                      >
                        <Activity
                          className={`w-3.5 h-3.5 ${testingId === item.id ? "animate-spin text-indigo-400" : ""}`}
                        />
                      </button>

                      <button
                        onClick={() => handleSync(item.id)}
                        disabled={syncingId === item.id}
                        title="Sync Now"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-750 border border-slate-700 transition-colors"
                      >
                        <Play
                          className={`w-3.5 h-3.5 ${syncingId === item.id ? "animate-spin text-emerald-400" : ""}`}
                        />
                      </button>

                      <Link
                        href={`/integrations/${item.id}`}
                        title="Configure"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-750 border border-slate-700 inline-block transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Delete Integration"
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-750 border border-slate-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
