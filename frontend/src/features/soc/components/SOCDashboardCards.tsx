"use client";

import React from "react";
import { SOCDashboard } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Flame, Eye, Target, BookOpen, CheckSquare, XCircle, DollarSign } from "lucide-react";

interface SOCDashboardCardsProps {
  dashboard?: SOCDashboard;
  isLoading?: boolean;
}

export function SOCDashboardCards({ dashboard, isLoading }: SOCDashboardCardsProps) {
  if (isLoading || !dashboard) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="h-24 bg-slate-900/50 border-slate-800" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Critical Alerts",
      value: dashboard.critical_alerts,
      icon: ShieldAlert,
      color: "text-red-400 bg-red-950/40 border-red-900/60",
      valueColor: "text-red-400",
    },
    {
      title: "Open Incidents",
      value: dashboard.open_incidents,
      icon: Flame,
      color: "text-orange-400 bg-orange-950/40 border-orange-900/60",
      valueColor: "text-orange-400",
    },
    {
      title: "Incidents Investigating",
      value: dashboard.incidents_investigating,
      icon: Eye,
      color: "text-purple-400 bg-purple-950/40 border-purple-900/60",
      valueColor: "text-purple-400",
    },
    {
      title: "Assets Under Attack",
      value: dashboard.assets_under_attack,
      icon: Target,
      color: "text-amber-400 bg-amber-950/40 border-amber-900/60",
      valueColor: "text-amber-400",
    },
    {
      title: "Active Playbooks",
      value: dashboard.active_playbooks,
      icon: BookOpen,
      color: "text-indigo-400 bg-indigo-950/40 border-indigo-900/60",
      valueColor: "text-indigo-400",
    },
    {
      title: "Pending Approvals",
      value: dashboard.pending_approvals,
      icon: CheckSquare,
      color: "text-blue-400 bg-blue-950/40 border-blue-900/60",
      valueColor: "text-blue-400",
    },
    {
      title: "Failed Actions",
      value: dashboard.failed_actions,
      icon: XCircle,
      color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/60",
      valueColor: "text-emerald-400",
    },
    {
      title: "Active Financial Exposure",
      value: `$${(dashboard.financial_exposure / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-pink-400 bg-pink-950/40 border-pink-900/60",
      valueColor: "text-pink-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-slate-900/60 border-slate-800 shadow-md backdrop-blur-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.title}</p>
                <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>{card.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
