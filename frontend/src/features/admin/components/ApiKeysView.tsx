"use client";

import React, { useState } from "react";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "../hooks";

export function ApiKeysView() {
  const { data: keys, isLoading } = useApiKeys();
  const createMutation = useCreateApiKey();
  const revokeMutation = useRevokeApiKey();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [expirationDays, setExpirationDays] = useState(90);

  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { name: keyName, expiration_days: expirationDays },
      {
        onSuccess: (res) => {
          setGeneratedSecret(res.secret_key);
          setKeyName("");
        },
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = (id: string, name: string) => {
    if (confirm(`Permanently revoke API key "${name}"? External applications using this token will stop working immediately.`)) {
      revokeMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Key className="w-6 h-6 text-indigo-400" /> API Keys & Integration Credentials
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate programmatic tokens for SIEM collectors, vulnerability scanners, and automated scripts.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedSecret(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate API Key
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Key Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Last Used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(keys || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No active API keys found.
                  </td>
                </tr>
              ) : (
                keys?.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-200 block">{k.name}</span>
                      <span className="text-xs text-slate-500 font-mono">{k.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          k.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {k.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {k.is_active && (
                        <button
                          onClick={() => handleRevoke(k.id, k.name)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-xs text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
                        >
                          Revoke Key
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Generate New API Key
            </h3>

            {generatedSecret ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Copy this secret key immediately. You will never be able to view this token again.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-indigo-300 break-all">{generatedSecret}</span>
                  <button
                    onClick={() => copyToClipboard(generatedSecret)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setGeneratedSecret(null);
                    setShowCreateModal(false);
                  }}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Key Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Splunk Heavy Forwarder Connector"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Expiration Period</label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  >
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={365}>1 Year</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    {createMutation.isPending ? "Generating..." : "Generate Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
