"use client";

import React, { useState } from "react";
import { Sliders, Plus, Trash2, Save, ArrowRight, Check } from "lucide-react";
import { useUpdateIntegration } from "../hooks";
import type { IntegrationItem } from "../types";

export function IntegrationMappingEditor({ integration }: { integration: IntegrationItem }) {
  const updateMutation = useUpdateIntegration();

  const [mappings, setMappings] = useState<Array<{ external: string; internal: string }>>(() => {
    const initial = Object.entries(integration.field_mappings || {}).map(([k, v]) => ({
      external: k,
      internal: v,
    }));
    return initial.length > 0
      ? initial
      : [
          { external: "hostname", internal: "name" },
          { external: "ip_addr", internal: "ip_address" },
          { external: "cve", internal: "cve_id" },
        ];
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddRow = () => {
    setMappings([...mappings, { external: "", internal: "name" }]);
  };

  const handleRemoveRow = (idx: number) => {
    setMappings(mappings.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const formatted: Record<string, string> = {};
    for (const m of mappings) {
      if (m.external.trim()) {
        formatted[m.external.trim()] = m.internal;
      }
    }

    updateMutation.mutate(
      {
        id: integration.id,
        payload: { field_mappings: formatted },
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      }
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Field & Canonical Schema Mappings
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Map external telemetry field names to authoritative platform asset and vulnerability attributes.
          </p>
        </div>

        <button
          onClick={handleAddRow}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Mapping
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          Field mappings updated and applied to downstream ingestion pipelines.
        </div>
      )}

      {/* Mappings Table */}
      <div className="space-y-3">
        {mappings.map((m, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="e.g. host_name or dns_name"
              value={m.external}
              onChange={(e) => {
                const next = [...mappings];
                next[idx].external = e.target.value;
                setMappings(next);
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono"
            />

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

            <select
              value={m.internal}
              onChange={(e) => {
                const next = [...mappings];
                next[idx].internal = e.target.value;
                setMappings(next);
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
            >
              <option value="name">Asset Name (Hostname)</option>
              <option value="ip_address">Asset IP Address</option>
              <option value="operating_system">Operating System</option>
              <option value="asset_type">Asset Type</option>
              <option value="environment">Environment</option>
              <option value="criticality">Criticality Level</option>
              <option value="cve_id">Vulnerability CVE ID</option>
              <option value="severity">Vulnerability Severity</option>
            </select>

            <button
              onClick={() => handleRemoveRow(idx)}
              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
              title="Remove row"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800 flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? "Saving..." : "Save Field Mappings"}
        </button>
      </div>
    </div>
  );
}
