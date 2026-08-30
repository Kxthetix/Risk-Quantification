"use client";

import React from "react";
import { Database, ShieldCheck, CheckCircle2, AlertCircle, Copy, BarChart2 } from "lucide-react";
import { useDataQualityStats } from "../hooks";

export function IntegrationDataView() {
  const { data: stats, isLoading } = useDataQualityStats();

  if (isLoading || !stats) {
    return <div className="h-64 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />;
  }

  const entities = [
    { name: "Assets Ingested", count: stats.assets_imported, desc: "Servers, Workstations, Cloud VMs" },
    { name: "Vulnerabilities Mapped", count: stats.vulnerabilities_imported, desc: "CVEs, Misconfigurations, Findings" },
    { name: "Threat IOCs Streamed", count: stats.threats_imported, desc: "Malicious IPs, Domains, Hashes" },
    { name: "Security Events Parsed", count: stats.events_imported.toLocaleString(), desc: "Log entries, Telemetry records" },
    { name: "Identities Normalized", count: stats.identities_imported, desc: "Users, Roles, Privileged Service Accounts" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Database className="w-6 h-6 text-indigo-400" /> Ingested Data Quality & Entity Metrics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor canonical normalization rates, deduplication efficiency, and entity distributions across connectors.
        </p>
      </div>

      {/* Quality Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              Accepted & Normalized
            </span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">
              {stats.accepted_percentage}%
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              Deduplicated Records
            </span>
            <span className="text-2xl font-bold text-sky-400 mt-1 block font-mono">
              {stats.duplicate_percentage}%
            </span>
          </div>
          <Copy className="w-8 h-8 text-sky-500/30" />
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block uppercase tracking-wider">
              Rejected (Malformed)
            </span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block font-mono">
              {stats.rejected_percentage}%
            </span>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-500/30" />
        </div>
      </div>

      {/* Entity Breakdown */}
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" />
          Ingested Security Entities Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {entities.map((ent, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">{ent.name}</span>
              <span className="text-2xl font-bold text-slate-100 font-mono block">{ent.count}</span>
              <span className="text-[11px] text-slate-500 block">{ent.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
