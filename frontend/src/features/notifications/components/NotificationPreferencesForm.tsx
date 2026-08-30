"use client";

import React, { useEffect, useState } from "react";
import { Bell, Mail, Webhook, ShieldAlert, Save } from "lucide-react";
import { useNotificationPreferences, useUpdateNotificationPreferences } from "../hooks";

export function NotificationPreferencesForm() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updateMutation = useUpdateNotificationPreferences();

  const [form, setForm] = useState({
    email_alerts_enabled: true,
    in_app_alerts_enabled: true,
    webhook_alerts_enabled: false,
    webhook_url: "",
    critical_only: false,
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (preferences) {
      setForm({
        email_alerts_enabled: preferences.email_alerts_enabled,
        in_app_alerts_enabled: preferences.in_app_alerts_enabled,
        webhook_alerts_enabled: preferences.webhook_alerts_enabled,
        webhook_url: preferences.webhook_url || "",
        critical_only: preferences.critical_only,
      });
    }
  }, [preferences]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form, {
      onSuccess: () => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      },
    });
  };

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" /> Notification Channels
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Choose which channels receive risk escalation alerts and security notices.
          </p>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={form.email_alerts_enabled}
              onChange={(e) => setForm({ ...form, email_alerts_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <div>
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400" /> Email Notifications
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive security briefs and urgent incident escalations to your registered work email.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={form.in_app_alerts_enabled}
              onChange={(e) => setForm({ ...form, in_app_alerts_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <div>
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" /> In-App Notification Banners
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time dashboard badges and bell alert updates for immediate situational awareness.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input
              type="checkbox"
              checked={form.webhook_alerts_enabled}
              onChange={(e) => setForm({ ...form, webhook_alerts_enabled: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <div className="flex-1">
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-emerald-400" /> Webhook Integration (Slack / Teams / SIEM)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Forward event payloads to external webhook targets and incident bridge channels.
              </p>

              {form.webhook_alerts_enabled && (
                <div className="mt-3">
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={form.webhook_url}
                    onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        <div className="border-t border-slate-800 pt-5">
          <label className="flex items-start gap-3.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.critical_only}
              onChange={(e) => setForm({ ...form, critical_only: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
            />
            <div>
              <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Strict Critical-Only Filter
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Suppress low/medium info signals and only deliver High and Critical security incidents.
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-sm font-medium text-emerald-400">Preferences updated successfully.</span>
          )}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </form>
  );
}
