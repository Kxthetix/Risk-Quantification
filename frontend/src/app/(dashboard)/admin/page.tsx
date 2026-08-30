import React from "react";
import { AdminDashboardCards, UserManagementView, SystemHealthView } from "@/features/admin";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Platform Administration & Governance</h1>
        <p className="text-sm text-slate-400 mt-1">
          Unified administration console for user management, tenant isolation, security policies, and integrations.
        </p>
      </div>

      <AdminDashboardCards />

      <div className="pt-2">
        <UserManagementView />
      </div>

      <div className="pt-2">
        <SystemHealthView />
      </div>
    </div>
  );
}
