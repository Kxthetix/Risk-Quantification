"use client";

import React from "react";
import { MonitoringDashboard } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Bell, Flame, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";

interface MonitoringOverviewCardsProps {
  dashboard?: MonitoringDashboard;
  isLoading?: boolean;
}

export function MonitoringOverviewCards({ dashboard, isLoading }: MonitoringOverviewCardsProps) {
  if (isLoading || !dashboard) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-28 bg-slate-900/50 border-slate-800" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Event Ingestion Rate",
      value: `${dashboard.events_per_second.toFixed(1)} /sec`,
      subtitle: `${(dashboard.total_events_today / 1000000).toFixed(2)}M telemetry records today`,
      icon: Activity,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
      valueColor: "text-emerald-400",
    },
    {
      title: "Active Security Alerts",
      value: dashboard.active_alerts_count,
      subtitle: `${dashboard.threat_actors_detected} adversary actors surfaced`,
      icon: Bell,
      color: "text-amber-400 bg-amber-950/40 border-amber-900/60",
      valueColor: "text-amber-400",
    },
    {
      title: "Critical Incidents",
      value: dashboard.critical_incidents_count,
      subtitle: `${dashboard.compromised_assets_count} compromised perimeter assets`,
      icon: Flame,
      color: "text-red-400 bg-red-950/40 border-red-900/60",
      valueColor: "text-red-400",
    },
    {
      title: "Detection Latency & Health",
      value: `${dashboard.processing_latency_ms.toFixed(1)}ms`,
      subtitle: `${dashboard.system_health_pct}% SOC pipeline uptime`,
      icon: Cpu,
      color: "text-indigo-400 bg-indigo-950/40 border-indigo-900/60",
      valueColor: "text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-slate-900/60 border-slate-800 shadow-lg backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1.5 ${card.valueColor}`}>{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
