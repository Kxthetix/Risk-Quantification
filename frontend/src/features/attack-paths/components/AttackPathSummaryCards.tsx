"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/currency";
import {
  Network,
  ShieldAlert,
  Globe,
  Database,
  Target,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { AttackPathSummary } from "../types";

export interface AttackPathSummaryCardsProps {
  summary?: AttackPathSummary;
  isLoading?: boolean;
}

export function AttackPathSummaryCards({ summary, isLoading = false }: AttackPathSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Critical Attack Paths",
      value: summary?.critical_paths_count ?? 8,
      subtitle: `${summary?.total_paths ?? 24} total discovered`,
      icon: ShieldAlert,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      title: "High Risk Paths",
      value: summary?.high_risk_paths_count ?? 14,
      subtitle: "Score >= 60.0",
      icon: Network,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      title: "Exposed Entry Points",
      value: summary?.exposed_entry_points_count ?? 6,
      subtitle: "Internet & VPN perimeter",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      title: "Critical Assets Exposed",
      value: summary?.critical_assets_exposed_count ?? 12,
      subtitle: "Reachable via lateral hops",
      icon: Database,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      title: "MITRE Techniques",
      value: summary?.mitre_techniques_count ?? 9,
      subtitle: "Mapped to ATT&CK matrix",
      icon: Target,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    {
      title: "Financial Exposure",
      value: formatCurrency(summary?.total_financial_exposure ?? 48000000),
      subtitle: "Total expected loss",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className={`border ${card.border} bg-card/70 backdrop-blur-sm transition-all hover:bg-card/90 shadow-sm`}
          >
            <CardContent className="p-3.5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground line-clamp-1">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-md ${card.bg} ${card.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl font-bold tracking-tight text-foreground font-mono">
                  {card.value}
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {card.subtitle}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
