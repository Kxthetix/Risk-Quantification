"use client";

import React, { useState } from "react";
import { Server, Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sliders } from "lucide-react";
import { useIntegrations, useTestIntegration } from "../hooks";

export function IntegrationsView() {
  const { data: integrations, isLoading } = useIntegrations();
  const testMutation = useTestIntegration();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { status: string; latency_ms: number; message: string }>>({});

  const handleTest = (id: string) => {
    setTestingId(id);
    testMutation.mutate(id, {
      onSuccess: (res) => {
        setTestResults((prev) => ({ ...prev, [id]: res }));
        setTestingId(null);
      },
      onError: () => {
        setTestResults((prev) => ({
          ...prev,
          [id]: { status: "FAILED", latency_ms: 0, message: "Connection request timed out." },
        }));
        setTestingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Server className="w-6 h-6 text-indigo-400" /> External Security Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect external telemetry feeds, SIEM forwarders, endpoint detection tools, and identity providers.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(integrations || []).map((item) => {
            const testResult = testResults[item.id];
            return (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-base">{item.name}</span>
                      <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {item.type}
                      </span>
                    </div>

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

                  <p className="text-xs text-slate-400 mt-2">
                    {item.last_error ? (
                      <span className="text-rose-400">Error: {item.last_error}</span>
                    ) : item.last_sync_at ? (
                      `Last synchronized: ${new Date(item.last_sync_at).toLocaleString()}`
                    ) : (
                      "Connected and ready for event ingestion."
                    )}
                  </p>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      testResult.status === "CONNECTED"
                        ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                        : "bg-rose-950/40 border-rose-800/60 text-rose-300"
                    }`}
                  >
                    <span>{testResult.message}</span>
                    <span className="font-mono">{testResult.latency_ms} ms</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-xs text-slate-500 font-mono">ID: {item.id}</span>
                  <button
                    onClick={() => handleTest(item.id)}
                    disabled={testingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-750 border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingId === item.id ? "animate-spin text-indigo-400" : ""}`} />
                    {testingId === item.id ? "Testing..." : "Test Connection"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
