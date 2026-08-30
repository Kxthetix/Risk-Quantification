"use client";

import React, { useState } from "react";
import { Plus, Trash2, Sliders, CheckCircle2, XCircle } from "lucide-react";
import { useNotificationRules, useCreateNotificationRule, useDeleteNotificationRule, useUpdateNotificationRule } from "../hooks";

export function NotificationRulesTable() {
  const { data: rules, isLoading } = useNotificationRules();
  const createMutation = useCreateNotificationRule();
  const deleteMutation = useDeleteNotificationRule();
  const updateMutation = useUpdateNotificationRule();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRule, setNewRule] = useState({
    event_type: "Critical Incident",
    condition_operator: "EQ",
    condition_value: "Critical",
    recipients: "Security Operations Team",
    channel: "Email + In-App",
    frequency: "Immediate",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        ...newRule,
        recipients: newRule.recipients.split(",").map((r) => r.trim()),
      },
      {
        onSuccess: () => {
          setShowCreateModal(false);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" /> Automated Notification Rules
          </h3>
          <p className="text-sm text-slate-400">
            Define recipient routing and channel policies based on event severity and anomaly thresholds.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(rules || []).map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">{r.event_type}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                    {r.condition_operator} {r.condition_value}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.recipients.join(", ")}</td>
                  <td className="px-4 py-3 text-slate-300">{r.channel}</td>
                  <td className="px-4 py-3 text-slate-400">{r.frequency}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => updateMutation.mutate({ id: r.id, payload: { is_active: !r.is_active } })}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-slate-700/30 text-slate-400 border border-slate-700/40"
                      }`}
                    >
                      {r.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {r.is_active ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(r.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-100">Create Notification Rule</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Event Type</label>
                <input
                  type="text"
                  required
                  value={newRule.event_type}
                  onChange={(e) => setNewRule({ ...newRule, event_type: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Condition Value</label>
                <input
                  type="text"
                  required
                  value={newRule.condition_value}
                  onChange={(e) => setNewRule({ ...newRule, condition_value: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Recipients (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={newRule.recipients}
                  onChange={(e) => setNewRule({ ...newRule, recipients: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Channel</label>
                <select
                  value={newRule.channel}
                  onChange={(e) => setNewRule({ ...newRule, channel: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <option value="Email + In-App">Email + In-App</option>
                  <option value="In-App Only">In-App Only</option>
                  <option value="Email Only">Email Only</option>
                  <option value="Webhook">Webhook</option>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
