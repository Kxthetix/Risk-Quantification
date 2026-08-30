import React from "react";
import { AdminDashboardCards, SystemHealthView } from "@/features/admin";

export default function AdminUsagePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform & API Usage Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor API volume consumption, rate limit quotas, storage capacity, and tenant request distributions.
        </p>
      </div>

      <AdminDashboardCards />
      <SystemHealthView />
    </div>
  );
}
