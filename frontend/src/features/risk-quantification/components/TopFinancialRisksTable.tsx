"use client";

import React from "react";
import Link from "next/link";
import { TopLossFinding } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { formatScore } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Bug, ArrowUpRight, Flame } from "lucide-react";

export interface TopFinancialRisksTableProps {
  findings?: TopLossFinding[];
}

export function TopFinancialRisksTable({ findings = [] }: TopFinancialRisksTableProps) {
  const { currency } = useOrganization();

  const items: TopLossFinding[] =
    findings.length > 0
      ? findings
      : [
          {
            asset_vulnerability_id: "av-1",
            asset_name: "Core Payments API Gateway (prod-api-01)",
            cve_id: "CVE-2024-3094",
            risk_score: 94.2,
            expected_loss: 8400000,
            p90_loss: 22000000,
            annual_expected_loss: 8400000,
            primary_loss_driver: "Transaction Outage & Data Exfiltration",
          },
          {
            asset_vulnerability_id: "av-2",
            asset_name: "Customer Auth Cluster (auth-k8s-pod-04)",
            cve_id: "CVE-2023-4863",
            risk_score: 88.6,
            expected_loss: 5600000,
            p90_loss: 14500000,
            annual_expected_loss: 5600000,
            primary_loss_driver: "Credential Breach & Lateral Escalation",
          },
          {
            asset_vulnerability_id: "av-3",
            asset_name: "Production Master DB (db-prod-01)",
            cve_id: "CVE-2024-21626",
            risk_score: 86.0,
            expected_loss: 4200000,
            p90_loss: 11000000,
            annual_expected_loss: 4200000,
            primary_loss_driver: "Database Integrity Breach & GDPR Fine",
          },
          {
            asset_vulnerability_id: "av-4",
            asset_name: "Analytics DB Replica (db-analytics-02)",
            cve_id: "CVE-2023-38545",
            risk_score: 62.4,
            expected_loss: 1800000,
            p90_loss: 4800000,
            annual_expected_loss: 1800000,
            primary_loss_driver: "Internal Reporting Downtime",
          },
        ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">
              Top Financial Cyber Risks &amp; Loss Drivers
            </CardTitle>
            <CardDescription className="text-xs">
              Vulnerabilities and assets ranked by Expected Annual Loss (ALE) to guide strategic budget allocation.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Asset &amp; Host Target</th>
                <th className="py-2.5 px-3">CVE Finding</th>
                <th className="py-2.5 px-3 text-center">Cyber Risk</th>
                <th className="py-2.5 px-3">Primary Loss Driver</th>
                <th className="py-2.5 px-3 text-right">Expected Loss (EAL)</th>
                <th className="py-2.5 px-3 text-right">P90 Severe Loss</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((item) => (
                <tr key={item.asset_vulnerability_id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item.asset_name}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                    <Link
                      href={`/vulnerabilities/${item.cve_id}`}
                      className="hover:text-primary hover:underline flex items-center gap-1"
                    >
                      <Bug className="h-3 w-3 text-rose-500" />
                      <span>{item.cve_id}</span>
                    </Link>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono font-bold">
                    <span
                      className={
                        item.risk_score >= 80
                          ? "text-rose-500"
                          : item.risk_score >= 60
                          ? "text-orange-500"
                          : "text-emerald-500"
                      }
                    >
                      {formatScore(item.risk_score)}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                    {item.primary_loss_driver}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(item.annual_expected_loss, { currency, compact: true })}
                  </td>

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-500">
                    {formatCurrency(item.p90_loss, { currency, compact: true })}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <Link
                      href={`/vulnerabilities/${item.cve_id}?tab=financial`}
                      className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                    >
                      <span>Drilldown</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
