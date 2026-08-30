"use client";

import React from "react";
import { AlertSummary } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ShieldAlert, CheckCircle2, Clock, XCircle } from "lucide-react";

interface AlertSummaryCardsProps {
  summary?: AlertSummary;
  isLoading?: boolean;
}

export function AlertSummaryCards({ summary, isLoading }: AlertSummaryCardsProps) {
  if (isLoading || !summary) {
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
      title: "Open Alerts",
      value: summary.open_alerts,
      subtitle: `${summary.critical_alerts} Critical · ${summary.high_alerts} High`,
      icon: Bell,
      color: "text-red-400 bg-red-950/40 border-red-900/60",
      valueColor: "text-red-400",
    },
    {
      title: "Mean Time to Acknowledge (MTTA)",
      value: `${summary.mtta_minutes.toFixed(1)}m`,
      subtitle: `MTTD: ${summary.mttd_minutes.toFixed(1)}m`,
      icon: Clock,
      color: "text-amber-400 bg-amber-950/40 border-amber-900/60",
      valueColor: "text-amber-400",
    },
    {
      title: "Resolved Alerts",
      value: summary.resolved_alerts,
      subtitle: `MTTR: ${summary.mttr_minutes.toFixed(0)}m average`,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
      valueColor: "text-emerald-400",
    },
    {
      title: "False Positive Rate",
      value: `${summary.false_positive_rate_pct}%`,
      subtitle: `${summary.false_positives_count} filtered detections`,
      icon: XCircle,
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
