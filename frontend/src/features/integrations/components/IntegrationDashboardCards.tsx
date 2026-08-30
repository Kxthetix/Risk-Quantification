"use client";

import React from "react";
import { Server, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, Layers } from "lucide-react";
import { useIntegrationStats } from "../hooks";

export function IntegrationDashboardCards() {
  const { data: stats, isLoading } = useIntegrationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Connectors",
      value: stats?.total_integrations ?? 0,
      icon: Layers,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      title: "Connected",
      value: stats?.connected_count ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Syncing Now",
      value: stats?.syncing_count ?? 0,
      icon: RefreshCw,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Degraded",
      value: stats?.degraded_count ?? 0,
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Disconnected",
      value: stats?.disconnected_count ?? 0,
      icon: Server,
      color: "text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
    },
    {
      title: "Failed Syncs",
      value: stats?.failed_count ?? 0,
      icon: XCircle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
              <div className={`p-1.5 rounded-lg border ${c.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${c.color}`} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-100">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}
