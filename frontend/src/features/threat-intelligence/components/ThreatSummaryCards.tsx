"use client";

import React from "react";
import { ThreatSummary } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Radio, Bug, Globe, AlertTriangle, Activity } from "lucide-react";

interface ThreatSummaryCardsProps {
  summary?: ThreatSummary;
  isLoading?: boolean;
}

export function ThreatSummaryCards({ summary, isLoading }: ThreatSummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-slate-900/50 border-slate-800">
            <CardContent className="p-6 h-28" />
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Threats",
      value: summary.active_threats,
      subtitle: `${summary.critical_threats} Critical severity`,
      icon: Radio,
      color: "text-red-400 bg-red-950/40 border-red-900/60",
      valueColor: "text-red-400",
    },
    {
      title: "Malicious Indicators",
      value: summary.new_iocs,
      subtitle: `${summary.malicious_ips} IPs · ${summary.malicious_domains} Domains`,
      icon: Bug,
      color: "text-amber-400 bg-amber-950/40 border-amber-900/60",
      valueColor: "text-amber-400",
    },
    {
      title: "Affected Assets",
      value: summary.affected_assets,
      subtitle: `${summary.active_incidents} Active incidents triggered`,
      icon: AlertTriangle,
      color: "text-orange-400 bg-orange-950/40 border-orange-900/60",
      valueColor: "text-orange-400",
    },
    {
      title: "Threat Exposure Score",
      value: `${summary.threat_risk.toFixed(1)}/100`,
      subtitle: `${summary.threat_risk_level} Risk Posture`,
      icon: ShieldAlert,
      color: "text-purple-400 bg-purple-950/40 border-purple-900/60",
      valueColor: summary.threat_risk >= 80 ? "text-red-400" : "text-purple-400",
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
