"use client";

import React, { useState } from "react";
import {
  Flame,
  ShieldAlert,
  Bug,
  Lock,
  Server,
  Activity,
  CheckSquare,
  Radio,
  Plus,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import { useConnectorCatalog, useCreateIntegration } from "../hooks";
import { CATEGORY_LABELS, INTEGRATION_CATEGORIES } from "../constants";
import type { IntegrationCatalogItem } from "../types";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame,
  ShieldAlert,
  Bug,
  Lock,
  Server,
  Activity,
  CheckSquare,
  Radio,
  Layers,
};

export function IntegrationCatalog({ onConnected }: { onConnected?: () => void }) {
  const { data: catalog, isLoading } = useConnectorCatalog();
  const createMutation = useCreateIntegration();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedConnector, setSelectedConnector] = useState<IntegrationCatalogItem | null>(null);
  const [connectName, setConnectName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");

  const filteredCatalog = (catalog || []).filter((item) => {
    if (selectedCategory === "ALL") return true;
    return item.category === selectedCategory;
  });

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnector) return;

    createMutation.mutate(
      {
        name: connectName || selectedConnector.name,
        category: selectedConnector.category,
        connector_type: selectedConnector.id.split("-")[1] || selectedConnector.id,
        auth_method: selectedConnector.auth_methods[0] || "API_KEY",
        endpoint_url: endpointUrl || undefined,
        credentials: apiKeySecret ? { api_key: apiKeySecret } : undefined,
        sync_frequency: "HOURLY",
        sync_mode: "INCREMENTAL",
        is_enabled: true,
      },
      {
        onSuccess: () => {
          setSelectedConnector(null);
          setConnectName("");
          setEndpointUrl("");
          setApiKeySecret("");
          if (onConnected) onConnected();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {INTEGRATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Connectors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => {
            const Icon = ICON_MAP[item.icon] || Server;
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      v{item.version}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-100 mt-3">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.supported_data.map((d) => (
                      <span
                        key={d}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700 font-medium"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    {item.auth_methods.join(" / ")}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedConnector(item);
                      setConnectName(item.name);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Connect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Connect Modal */}
      {selectedConnector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Connect {selectedConnector.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure connection credentials and remote telemetry endpoint.
              </p>
            </div>

            <form onSubmit={handleConnectSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Connector Name</label>
                <input
                  type="text"
                  required
                  value={connectName}
                  onChange={(e) => setConnectName(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://api.security-service.corp"
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  API Key / Secret Token (Saved securely)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={apiKeySecret}
                  onChange={(e) => setApiKeySecret(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedConnector(null)}
                  className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Connecting..." : "Add Connector"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
