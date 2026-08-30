"use client";

import React from "react";
import { IncidentSummary } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, ShieldAlert, CheckCircle2, DollarSign, Clock, ShieldCheck } from "lucide-react";

interface IncidentSummaryCardsProps {
  summary?: IncidentSummary;
  isLoading?: boolean;
}

export function IncidentSummaryCards({ summary, isLoading }: IncidentSummaryCardsProps) {
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
      title: "Active Open Incidents",
      value: summary.open_incidents,
      subtitle: `${summary.critical_incidents} Critical · ${summary.investigating_count} Investigating`,
      icon: Flame,
      color: "text-red-400 bg-red-950/40 border-red-900/60",
      valueColor: "text-red-400",
    },
    {
      title: "Mean Time to Contain (MTTC)",
      value: `${summary.mttc_minutes.toFixed(0)}m`,
      subtitle: `MTTR: ${summary.mttr_minutes.toFixed(0)}m average`,
      icon: Clock,
      color: "text-amber-400 bg-amber-950/40 border-amber-900/60",
      valueColor: "text-amber-400",
    },
    {
      title: "Contained & Resolved",
      value: `${summary.contained_count + summary.resolved_count}`,
      subtitle: `${summary.contained_count} Contained · ${summary.resolved_count} Closed`,
      icon: ShieldCheck,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
      valueColor: "text-emerald-400",
    },
    {
      title: "Active Financial Exposure",
      value: `$${(summary.total_financial_exposure / 1000000).toFixed(1)}M`,
      subtitle: "Aggregated breach potential",
      icon: DollarSign,
      color: "text-purple-400 bg-purple-950/40 border-purple-900/60",
      valueColor: "text-purple-400",
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
