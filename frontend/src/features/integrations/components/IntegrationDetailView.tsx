"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Sliders,
  Calendar,
  Layers,
  FileText,
  Activity,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  ArrowLeft,
} from "lucide-react";
import {
  useIntegration,
  useUpdateIntegration,
  useTestConnection,
  useSyncIntegration,
  useIntegrationLogs,
} from "../hooks";
import { IntegrationLogsTable } from "./IntegrationLogsTable";
import { IntegrationHealthCard } from "./IntegrationHealthCard";
import { IntegrationMappingEditor } from "./IntegrationMappingEditor";

export function IntegrationDetailView({ integrationId }: { integrationId: string }) {
  const { data: item, isLoading } = useIntegration(integrationId);
  const { data: logs } = useIntegrationLogs(integrationId);
  const updateMutation = useUpdateIntegration();
  const testMutation = useTestConnection();
  const syncMutation = useSyncIntegration();

  const [activeTab, setActiveTab] = useState<
    "overview" | "config" | "schedule" | "mapping" | "logs" | "health"
  >("overview");

  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [syncFrequency, setSyncFrequency] = useState("HOURLY");
  const [syncMode, setSyncMode] = useState("INCREMENTAL");
  const [isEnabled, setIsEnabled] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setEndpointUrl(item.endpoint_url || "");
      setSyncFrequency(item.sync_frequency);
      setSyncMode(item.sync_mode);
      setIsEnabled(item.is_enabled);
    }
  }, [item]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: integrationId,
        payload: {
          name,
          endpoint_url: endpointUrl || undefined,
          sync_frequency: syncFrequency,
          sync_mode: syncMode,
          is_enabled: isEnabled,
        },
      },
      {
        onSuccess: () => {
          setSaveNotice("Configuration updated successfully.");
          setTimeout(() => setSaveNotice(null), 3000);
        },
      }
    );
  };

  if (isLoading || !item) {
    return <div className="h-96 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/integrations"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">{item.name}</h1>
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
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Category: {item.category} | Connector: {item.connector_type} | Auth: {item.auth_method}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => testMutation.mutate({ id: item.id })}
            disabled={testMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            {testMutation.isPending ? "Testing..." : "Test Connection"}
          </button>

          <button
            onClick={() => syncMutation.mutate({ id: item.id })}
            disabled={syncMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {syncMutation.isPending ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {saveNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
          {saveNotice}
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "config"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab("mapping")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "mapping"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Field & Severity Mapping
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "logs"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Execution Logs ({logs?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("health")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            activeTab === "health"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Health & Dependencies
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">Connector Telemetry Status</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.last_error ? (
                  <span className="text-rose-400 font-mono">Last Error: {item.last_error}</span>
                ) : (
                  "Connector is active and actively feeding normalized events into asset correlation and risk engines."
                )}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Sync Frequency</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono mt-0.5 block">
                    {item.sync_frequency}
                  </span>
                </div>
                <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Sync Mode</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono mt-0.5 block">
                    {item.sync_mode}
                  </span>
                </div>
                <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Last Run</span>
                  <span className="text-xs text-slate-300 mt-0.5 block">
                    {item.last_sync_at ? new Date(item.last_sync_at).toLocaleTimeString() : "Never"}
                  </span>
                </div>
                <div className="p-3 bg-slate-850/80 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Credentials</span>
                  <span className="text-xs font-semibold text-emerald-400 mt-0.5 block">Configured</span>
                </div>
              </div>
            </div>

            <IntegrationLogsTable logs={logs || []} />
          </div>

          <div className="space-y-4">
            <IntegrationHealthCard integration={item} />
          </div>
        </div>
      )}

      {activeTab === "config" && (
        <form onSubmit={handleSaveConfig} className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4 max-w-xl">
          <h3 className="text-base font-semibold text-slate-100">Connector Settings</h3>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Connector Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Endpoint URL</label>
            <input
              type="url"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Sync Frequency</label>
              <select
                value={syncFrequency}
                onChange={(e) => setSyncFrequency(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="EVERY_15_MINUTES">Every 15 Minutes</option>
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MANUAL">Manual Only</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Sync Mode</label>
              <select
                value={syncMode}
                onChange={(e) => setSyncMode(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="INCREMENTAL">Incremental (Delta)</option>
                <option value="FULL">Full Resynchronization</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900"
            />
            <span className="text-xs text-slate-300">Enable automated synchronization pipeline</span>
          </label>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      )}

      {activeTab === "mapping" && (
        <IntegrationMappingEditor integration={item} />
      )}

      {activeTab === "logs" && (
        <IntegrationLogsTable logs={logs || []} />
      )}

      {activeTab === "health" && (
        <div className="max-w-xl">
          <IntegrationHealthCard integration={item} />
        </div>
      )}
    </div>
  );
}
