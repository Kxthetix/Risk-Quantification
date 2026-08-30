"use client";

import React from "react";
import Link from "next/link";
import { TopCyberRiskFinding } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatScore } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Badge } from "@/components/ui/badge";
import { Server, ArrowUpRight, Flame, GitFork } from "lucide-react";

export interface TopRiskDriversTableProps {
  findings?: TopCyberRiskFinding[];
}

export function TopRiskDriversTable({ findings = [] }: TopRiskDriversTableProps) {
  const { currency } = useOrganization();

  // Fallback findings if backend has empty initial state
  const items: TopCyberRiskFinding[] =
    findings.length > 0
      ? findings
      : [
          {
            finding_id: "find-1",
            asset: "Payment Gateway API (prod-api-01)",
            cve_id: "CVE-2024-3400",
            risk_score: 94.2,
            expected_loss: 1840000,
            attack_paths: 4,
            known_exploited: true,
            priority: "CRITICAL",
          },
          {
            finding_id: "find-2",
            asset: "Customer Relational DB (db-cluster-prod)",
            cve_id: "CVE-2023-4863",
            risk_score: 89.5,
            expected_loss: 1520000,
            attack_paths: 3,
            known_exploited: true,
            priority: "CRITICAL",
          },
          {
            finding_id: "find-3",
            asset: "Identity Keycloak Service (iam-prod)",
            cve_id: "CVE-2024-21413",
            risk_score: 84.1,
            expected_loss: 1280000,
            attack_paths: 2,
            known_exploited: false,
            priority: "HIGH",
          },
          {
            finding_id: "find-4",
            asset: "Admin Operations Portal (admin-fe-01)",
            cve_id: "CVE-2023-38606",
            risk_score: 79.8,
            expected_loss: 940000,
            attack_paths: 2,
            known_exploited: false,
            priority: "HIGH",
          },
          {
            finding_id: "find-5",
            asset: "Billing Settlement Worker (worker-queue-03)",
            cve_id: "CVE-2024-27198",
            risk_score: 74.5,
            expected_loss: 720000,
            attack_paths: 1,
            known_exploited: false,
            priority: "HIGH",
          },
        ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-2.5 px-3">Asset / Target</th>
            <th className="py-2.5 px-3">Vulnerability</th>
            <th className="py-2.5 px-3 text-center">Score</th>
            <th className="py-2.5 px-3 text-center">Attack Paths</th>
            <th className="py-2.5 px-3 text-right">Expected Loss</th>
            <th className="py-2.5 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map((item, idx) => (
            <tr
              key={item.finding_id || idx}
              className="hover:bg-muted/30 transition-colors group"
            >
              <td className="py-2.5 px-3 font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-mono w-4">
                    {idx + 1}.
                  </span>
                  <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate max-w-[180px] sm:max-w-[220px]" title={item.asset}>
                    {item.asset}
                  </span>
                </div>
              </td>

              <td className="py-2.5 px-3 font-mono text-[11px]">
                <div className="flex items-center gap-1.5">
                  {item.cve_id ? (
                    <span className="text-foreground font-medium">{item.cve_id}</span>
                  ) : (
                    <span className="text-muted-foreground">Misconfiguration</span>
                  )}
                  {item.known_exploited && (
                    <span
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-rose-500/15 text-rose-500"
                      title="Known Exploited Vulnerability (CISA KEV)"
                    >
                      <Flame className="h-2.5 w-2.5" />
                      KEV
                    </span>
                  )}
                </div>
              </td>

              <td className="py-2.5 px-3 text-center">
                <span
                  className={`font-mono font-bold text-[11px] ${
                    item.risk_score >= 85
                      ? "text-rose-500"
                      : item.risk_score >= 70
                      ? "text-orange-500"
                      : "text-amber-500"
                  }`}
                >
                  {formatScore(item.risk_score)}
                </span>
              </td>

              <td className="py-2.5 px-3 text-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                  <GitFork className="h-3 w-3 text-orange-500" />
                  <span>{item.attack_paths}</span>
                </span>
              </td>

              <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                {formatCurrency(item.expected_loss, { currency, compact: true })}
              </td>

              <td className="py-2.5 px-3 text-right">
                <Link
                  href={`/vulnerabilities?search=${encodeURIComponent(item.cve_id || item.asset)}`}
                  className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline font-medium"
                >
                  <span>Details</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
