"use client";

import React, { useState } from "react";
import { Radio, Plus, Trash2, Copy, Check, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from "../hooks";

export function WebhooksManager() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createMutation = useCreateWebhook();
  const deleteMutation = useDeleteWebhook();

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>(["ALERT", "INCIDENT"]);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { name, event_types: eventTypes },
      {
        onSuccess: (res) => {
          setGeneratedSecret(res.signing_secret || null);
          setName("");
        },
      }
    );
  };

  const copySecret = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = (id: string, whName: string) => {
    if (confirm(`Delete webhook receiver "${whName}"? Inbound pushes to this URL will be rejected.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-indigo-400" /> Inbound Webhooks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Receive automated push notifications, detection events, and alerts from external security systems with HMAC-SHA256 verification.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedSecret(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Webhook Endpoint
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Webhook Name</th>
                <th className="px-4 py-3">Receiver Path</th>
                <th className="px-4 py-3">Accepted Events</th>
                <th className="px-4 py-3">Events Processed</th>
                <th className="px-4 py-3">Last Received</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(webhooks || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    No active webhook endpoints registered.
                  </td>
                </tr>
              ) : (
                webhooks?.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100">{w.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{w.webhook_url}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.event_types.map((e) => (
                          <span
                            key={e}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 font-mono">
                      <span className="text-emerald-400">{w.events_received} ok</span> /{" "}
                      <span className="text-rose-400">{w.events_failed} err</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {w.last_event_at ? new Date(w.last_event_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(w.id, w.name)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              Register Webhook Receiver
            </h3>

            {generatedSecret ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Copy this HMAC-SHA256 signing secret now. It will never be displayed again.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-indigo-300 break-all">{generatedSecret}</span>
                  <button
                    onClick={() => copySecret(generatedSecret)}
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy Secret"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setGeneratedSecret(null);
                    setShowModal(false);
                  }}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Receiver Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS GuardDuty Alert Webhook"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Subscribed Event Types</label>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    {["ALERT", "DETECTION", "INCIDENT", "VULNERABILITY"].map((evt) => (
                      <label key={evt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eventTypes.includes(evt)}
                          onChange={(e) => {
                            if (e.target.checked) setEventTypes([...eventTypes, evt]);
                            else setEventTypes(eventTypes.filter((t) => t !== evt));
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900"
                        />
                        <span>{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3.5 py-1.5 text-sm text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {createMutation.isPending ? "Generating..." : "Generate Webhook"}
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
