"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { ChokepointItem, MitigationItem } from "../types";

export interface MitigationRecommendationsPanelProps {
  chokepoints?: ChokepointItem[];
  baselineLoss?: number;
}

export function MitigationRecommendationsPanel({
  chokepoints = [],
  baselineLoss = 48000000,
}: MitigationRecommendationsPanelProps) {
  const [appliedMitigations, setAppliedMitigations] = useState<string[]>([]);

  const defaultMitigations: MitigationItem[] = [
    {
      id: "mit-1",
      title: "Patch Perimeter VPN Vulnerability (CVE-2024-3094)",
      description: "Upgrade VPN gateway firmware to prevent initial unauthenticated remote code execution.",
      control_type: "Vulnerability Remediation",
      blocked_paths_count: 8,
      risk_reduction_pct: 42,
      financial_reduction: 18500000,
      status: "In Progress",
      owner: "SecOps Team",
      due_date: "2026-09-10",
    },
    {
      id: "mit-2",
      title: "Enforce Multi-Factor Authentication & Privileged Access Management",
      description: "Require FIDO2 hardware keys and short-lived credentials on all administrative jumpboxes.",
      control_type: "Identity & Access Control",
      blocked_paths_count: 6,
      risk_reduction_pct: 35,
      financial_reduction: 14200000,
      status: "Open",
      owner: "IAM Team",
      due_date: "2026-09-15",
    },
    {
      id: "mit-3",
      title: "Isolate Payment Database Subnet (Microsegmentation)",
      description: "Deploy firewall ACLs restricting SQL connections exclusively to authenticated payment worker pods.",
      control_type: "Network Segmentation",
      blocked_paths_count: 9,
      risk_reduction_pct: 48,
      financial_reduction: 21000000,
      status: "Open",
      owner: "Network Eng",
      due_date: "2026-09-20",
    },
  ];

  const toggleMitigation = (id: string) => {
    setAppliedMitigations((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Calculate residual risk dynamically based on selected mitigations
  const totalReductionPct = Math.min(
    85,
    appliedMitigations.reduce((acc, mId) => {
      const item = defaultMitigations.find((m) => m.id === mId);
      return acc + (item ? item.risk_reduction_pct * 0.7 : 0);
    }, 0)
  );

  const totalFinancialReduction = (baselineLoss * totalReductionPct) / 100;
  const residualLoss = Math.max(0, baselineLoss - totalFinancialReduction);

  return (
    <div className="space-y-4">
      {/* Residual Risk Simulation Header Card */}
      <Card className="border border-border bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground">
                High-Leverage Mitigation &amp; Residual Risk Simulation
              </CardTitle>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {appliedMitigations.length} Mitigations Selected
            </span>
          </div>
          <CardDescription className="text-xs">
            Toggle controls to model how breaking critical choke-points slashes organization attack paths and expected annual loss.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 border border-border/60 text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">
                Current Modeled Loss (ALE)
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                {formatCurrency(baselineLoss)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-semibold block">
                Simulated Loss Reduction
              </span>
              <span className="font-mono font-bold text-emerald-500 text-sm">
                -{formatCurrency(totalFinancialReduction)} ({Math.round(totalReductionPct)}%)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">
                Projected Residual Loss
              </span>
              <span className="font-mono font-bold text-primary text-sm">
                {formatCurrency(residualLoss)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mitigation Action Items List */}
      <div className="space-y-3">
        {defaultMitigations.map((mit) => {
          const isApplied = appliedMitigations.includes(mit.id);

          return (
            <Card
              key={mit.id}
              className={`border transition-all duration-200 cursor-pointer ${
                isApplied
                  ? "border-emerald-500/50 bg-emerald-500/5 shadow-xs"
                  : "border-border bg-card/70 hover:border-border/80"
              }`}
              onClick={() => toggleMitigation(mit.id)}
            >
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-xs">
                      {mit.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {mit.control_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Status: <strong>{mit.status}</strong> · Owner: {mit.owner}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    {mit.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block">
                      Breaks {mit.blocked_paths_count} paths
                    </span>
                    <span className="font-mono font-bold text-emerald-500 text-xs">
                      -{formatCurrency(mit.financial_reduction)}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isApplied ? "secondary" : "outline"}
                    className={`h-8 text-xs font-semibold gap-1.5 ${
                      isApplied ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <span>Simulate</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
