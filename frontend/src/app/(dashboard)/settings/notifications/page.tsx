import React from "react";
import { NotificationPreferencesForm, NotificationRulesTable } from "@/features/notifications";

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Notification Preferences & Rules</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize personal alert delivery channels, webhooks, and organization-wide escalation rules.
        </p>
      </div>

      <NotificationPreferencesForm />
      <NotificationRulesTable />
    </div>
  );
}
