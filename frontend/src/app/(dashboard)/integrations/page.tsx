import React from "react";
import Link from "next/link";
import { Server, Plus, Layers, Database, Radio, Cpu } from "lucide-react";
import {
  IntegrationDashboardCards,
  IntegrationTable,
} from "@/features/integrations";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-400" />
            Security Integrations & Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect external SIEM, EDR, Vulnerability Scanners, IAM, Cloud, and Firewalls to canonical correlation and risk engines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/integrations/catalog"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Connector Catalog
          </Link>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors"
          >
            CSV Import
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <IntegrationDashboardCards />

      {/* Integrations Table */}
      <div className="pt-2">
        <IntegrationTable />
      </div>
    </div>
  );
}
