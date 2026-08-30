"use client";

import React from "react";
import Link from "next/link";
import { ThreatScenarioItem } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { useOrganization } from "@/providers/OrganizationProvider";
import { RiskBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layers,
  MoreHorizontal,
  Play,
  ArrowUpRight,
  ExternalLink,
  Flame,
  ShieldAlert,
} from "lucide-react";

export interface ScenarioTableProps {
  scenarios: ThreatScenarioItem[];
  isLoading?: boolean;
  onRunSimulation?: (scenario: ThreatScenarioItem) => void;
}

export function ScenarioTable({
  scenarios,
  isLoading = false,
  onRunSimulation,
}: ScenarioTableProps) {
  const { currency } = useOrganization();

  const items: ThreatScenarioItem[] =
    scenarios.length > 0
      ? scenarios
      : [
          {
            id: "sc-1",
            name: "Double-Extortion Ransomware on Core Payment Gateways",
            category: "RANSOMWARE",
            business_service: "Payment Processing",
            business_service_id: "bs-1",
            status: "ACTIVE",
            annual_rate_of_occurrence: 0.35,
            single_loss_expectancy: 51400000,
            expected_annual_loss: 18000000,
            p95_loss: 54000000,
            risk_level: "CRITICAL",
            affected_assets_count: 6,
            affected_asset_ids: ["a-1", "a-2"],
            last_simulated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: "sc-2",
            name: "Cloud IAM Privilege Escalation & Data Exfiltration",
            category: "CLOUD_OUTAGE",
            business_service: "User Authentication",
            business_service_id: "bs-2",
            status: "ACTIVE",
            annual_rate_of_occurrence: 0.42,
            single_loss_expectancy: 28500000,
            expected_annual_loss: 12000000,
            p95_loss: 36000000,
            risk_level: "HIGH",
            affected_assets_count: 4,
            affected_asset_ids: ["a-3"],
            last_simulated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: "sc-3",
            name: "Customer PII Database Exfiltration Breach",
            category: "DATA_BREACH",
            business_service: "Customer Management",
            business_service_id: "bs-3",
            status: "ACTIVE",
            annual_rate_of_occurrence: 0.2,
            single_loss_expectancy: 48000000,
            expected_annual_loss: 9600000,
            p95_loss: 32000000,
            risk_level: "HIGH",
            affected_assets_count: 3,
            affected_asset_ids: ["a-4"],
            last_simulated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          {
            id: "sc-4",
            name: "Critical Upstream Dependency Supply Chain Backdoor",
            category: "SUPPLY_CHAIN",
            business_service: "Payment Processing",
            business_service_id: "bs-1",
            status: "ACTIVE",
            annual_rate_of_occurrence: 0.15,
            single_loss_expectancy: 34000000,
            expected_annual_loss: 5100000,
            p95_loss: 18000000,
            risk_level: "MEDIUM",
            affected_assets_count: 8,
            affected_asset_ids: ["a-1", "a-5"],
            last_simulated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
        ];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground animate-pulse">
        Loading cyber risk scenario models...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Threat Scenario Name</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Business Workflow</th>
              <th className="py-3 px-3 text-center">Frequency (ARO)</th>
              <th className="py-3 px-3 text-right">Expected Loss (EAL)</th>
              <th className="py-3 px-3 text-right">P95 Severe Loss</th>
              <th className="py-3 px-3 text-center">Risk Level</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {items.map((sc) => (
              <tr key={sc.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground">
                  <div className="space-y-0.5">
                    <Link
                      href={`/risk-quantification/scenarios/${sc.id}`}
                      className="hover:text-primary hover:underline font-bold"
                    >
                      {sc.name}
                    </Link>
                    <div className="text-[10px] text-muted-foreground">
                      {sc.affected_assets_count} impacted endpoints
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3">
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {sc.category.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="py-3 px-3 text-muted-foreground">
                  {sc.business_service || "Unassigned"}
                </td>

                <td className="py-3 px-3 text-center font-mono font-medium">
                  {sc.annual_rate_of_occurrence.toFixed(2)}/yr
                </td>

                <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(sc.expected_annual_loss, { currency, compact: true })}
                </td>

                <td className="py-3 px-3 text-right font-mono font-bold text-rose-500">
                  {formatCurrency(sc.p95_loss, { currency, compact: true })}
                </td>

                <td className="py-3 px-3 text-center">
                  <RiskBadge level={sc.risk_level} className="text-[10px] px-1.5 py-0" />
                </td>

                <td className="py-3 px-3">
                  <span className="rounded bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 text-[10px] font-bold">
                    {sc.status}
                  </span>
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onRunSimulation && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRunSimulation(sc)}
                        className="h-7 w-7 text-primary hover:text-primary"
                        title="Run Monte Carlo Simulation"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                          <Link href={`/risk-quantification/scenarios/${sc.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            <span>View Scenario</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer gap-2">
                          <Link href={`/risk-quantification/sensitivity`}>
                            <ArrowUpRight className="h-3.5 w-3.5 text-amber-500" />
                            <span>Sensitivity Analysis</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
