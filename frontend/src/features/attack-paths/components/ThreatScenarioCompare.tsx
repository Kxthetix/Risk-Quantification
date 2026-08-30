"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { ThreatScenarioCompareResponse } from "../types";
import { GitCompare, Flame, ShieldAlert, TrendingDown } from "lucide-react";

export interface ThreatScenarioCompareProps {
  data?: ThreatScenarioCompareResponse;
}

export function ThreatScenarioCompare({ data }: ThreatScenarioCompareProps) {
  const defaultScenarios = [
    {
      scenario_id: "sc-1",
      name: "Ransomware Extortion Chain",
      attacker_profile: "Ransomware Group",
      likelihood: 0.72,
      impact: 0.94,
      risk_score: 91.5,
      expected_loss: 24500000,
      p90_loss: 58000000,
      target_criticality: "CRITICAL",
      confidence: 0.88,
      path_length: 4,
    },
    {
      scenario_id: "sc-2",
      name: "Covert Data Exfiltration",
      attacker_profile: "Nation-State APT",
      likelihood: 0.45,
      impact: 0.90,
      risk_score: 84.0,
      expected_loss: 16800000,
      p90_loss: 42000000,
      target_criticality: "CRITICAL",
      confidence: 0.90,
      path_length: 5,
    },
    {
      scenario_id: "sc-3",
      name: "Privileged Identity Abuse",
      attacker_profile: "Insider Threat",
      likelihood: 0.35,
      impact: 0.75,
      risk_score: 72.0,
      expected_loss: 9500000,
      p90_loss: 21000000,
      target_criticality: "HIGH",
      confidence: 0.80,
      path_length: 3,
    },
  ];

  const scenarios = data?.scenarios && data.scenarios.length > 0 ? data.scenarios : defaultScenarios;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((s, idx) => {
          const isHighestRisk = idx === 0;

          return (
            <Card
              key={s.scenario_id}
              className={`border bg-card/80 backdrop-blur-sm shadow-sm relative ${
                isHighestRisk ? "border-rose-500/50 ring-1 ring-rose-500/20" : "border-border"
              }`}
            >
              {isHighestRisk && (
                <div className="absolute -top-2.5 right-3 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Highest Financial Exposure
                </div>
              )}

              <CardHeader className="p-4 pb-2 border-b border-border">
                <span className="text-[10px] font-mono text-purple-400 uppercase">
                  {s.attacker_profile}
                </span>
                <CardTitle className="text-sm font-bold text-foreground">
                  {s.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="text-[10px] block uppercase">Risk Score</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-bold text-foreground font-mono text-sm">
                        {s.risk_score}
                      </span>
                      <RiskBadge level={s.risk_score >= 80 ? "CRITICAL" : "HIGH"} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] block uppercase">Path Length</span>
                    <span className="font-mono text-foreground font-semibold mt-0.5 block">
                      {s.path_length} hops
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] block uppercase">Likelihood</span>
                    <span className="font-mono text-foreground font-semibold mt-0.5 block">
                      {Math.round(s.likelihood * 100)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] block uppercase">Confidence</span>
                    <span className="font-mono text-foreground font-semibold mt-0.5 block">
                      {Math.round(s.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Expected Annual Loss (ALE):</span>
                    <span className="font-mono font-bold text-emerald-500 text-xs">
                      {formatCurrency(s.expected_loss)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">P90 Severe Loss:</span>
                    <span className="font-mono font-bold text-rose-400 text-xs">
                      {formatCurrency(s.p90_loss)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
