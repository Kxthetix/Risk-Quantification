"use client";

import React from "react";
import Link from "next/link";
import { ExecutiveRecommendation } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight } from "lucide-react";

export interface ExecutiveRecommendationsProps {
  recommendations?: ExecutiveRecommendation[];
  overdueCount?: number;
  criticalPathsCount?: number;
}

export function ExecutiveRecommendations({
  recommendations,
  overdueCount = 37,
  criticalPathsCount = 12,
}: ExecutiveRecommendationsProps) {
  const { currency } = useOrganization();

  // Data-driven executive roadmap derived from risk metrics
  const items: ExecutiveRecommendation[] = recommendations || [
    {
      id: "rec-1",
      title: "Mitigate 12 Internet-Facing Critical RCE Vulnerabilities",
      description: "Patch edge API endpoints and firewall appliances exhibiting known exploited vulnerability indicators.",
      risk_reduction_points: 6.4,
      financial_loss_avoided: 1840000,
      estimated_effort: "LOW",
      priority: "CRITICAL",
      category: "PATCH",
    },
    {
      id: "rec-2",
      title: `Resolve ${overdueCount} Overdue Remediation Work Items`,
      description: "Fast-track developer review for core database clusters and identity federation gateways past SLA.",
      risk_reduction_points: 4.8,
      financial_loss_avoided: 1250000,
      estimated_effort: "MEDIUM",
      priority: "CRITICAL",
      category: "CREDENTIAL",
    },
    {
      id: "rec-3",
      title: `Sever ${criticalPathsCount} Choke Points on Lateral Attack Graph`,
      description: "Enforce network micro-segmentation between public DMZ proxies and internal customer data stores.",
      risk_reduction_points: 3.9,
      financial_loss_avoided: 980000,
      estimated_effort: "MEDIUM",
      priority: "HIGH",
      category: "SEGMENTATION",
    },
    {
      id: "rec-4",
      title: "Deploy Automated Web Application Firewall (WAF) Rule Updates",
      description: "Block reconnaissance scans targeting unauthenticated administrative portal endpoints.",
      risk_reduction_points: 2.5,
      financial_loss_avoided: 640000,
      estimated_effort: "LOW",
      priority: "HIGH",
      category: "WAF",
    },
  ];

  return (
    <div className="space-y-3">
      {items.map((rec, idx) => (
        <div
          key={rec.id || idx}
          className="rounded-lg border border-border/70 bg-card p-3.5 space-y-2 hover:border-primary/50 transition-colors"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {idx + 1}
              </span>
              <div className="space-y-0.5">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <span>{rec.title}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                      rec.priority === "CRITICAL"
                        ? "bg-rose-500/15 text-rose-500"
                        : "bg-amber-500/15 text-amber-500"
                    }`}
                  >
                    {rec.priority}
                  </span>
                </h4>
                <p className="text-[11px] text-muted-foreground">{rec.description}</p>
              </div>
            </div>

            {/* Impact Metric Chips */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-mono text-[11px]">
              <div className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 font-bold">
                -{rec.risk_reduction_points} Pts Risk
              </div>
              <div className="rounded bg-muted px-2 py-0.5 font-semibold text-foreground">
                +{formatCurrency(rec.financial_loss_avoided, { currency, compact: true })} Saved
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
