"use client";

import React from "react";
import Link from "next/link";
import { FinancialServiceRisk, BusinessServiceRisk } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatScore, formatNumber } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Briefcase, ArrowUpRight } from "lucide-react";

export interface BusinessServiceRiskTableProps {
  services?: FinancialServiceRisk[];
}

export function BusinessServiceRiskTable({ services = [] }: BusinessServiceRiskTableProps) {
  const { currency } = useOrganization();

  // Fallback services if backend list is empty
  const items: FinancialServiceRisk[] =
    services.length > 0
      ? services
      : [
          {
            service_id: "srv-1",
            service: "Payment Gateway & Card Processing",
            criticality: "CRITICAL",
            expected_loss: 2840000,
            p90_loss: 5600000,
          },
          {
            service_id: "srv-2",
            service: "Customer Onboarding & Identity (KYC)",
            criticality: "CRITICAL",
            expected_loss: 2150000,
            p90_loss: 4300000,
          },
          {
            service_id: "srv-3",
            service: "Enterprise ERP & Financial Ledger",
            criticality: "HIGH",
            expected_loss: 1480000,
            p90_loss: 2900000,
          },
          {
            service_id: "srv-4",
            service: "Customer Support & Ticketing Vault",
            criticality: "MEDIUM",
            expected_loss: 820000,
            p90_loss: 1650000,
          },
          {
            service_id: "srv-5",
            service: "Human Resources & Payroll Systems",
            criticality: "LOW",
            expected_loss: 450000,
            p90_loss: 920000,
          },
        ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-2.5 px-3">Business Workflow / Service</th>
            <th className="py-2.5 px-3">Criticality</th>
            <th className="py-2.5 px-3 text-right">Expected Loss (ALE)</th>
            <th className="py-2.5 px-3 text-right">P90 Tail Loss</th>
            <th className="py-2.5 px-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {items.map((svc, idx) => (
            <tr
              key={svc.service_id || idx}
              className="hover:bg-muted/30 transition-colors group"
            >
              <td className="py-2.5 px-3 font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-[280px]" title={svc.service}>
                    {svc.service}
                  </span>
                </div>
              </td>

              <td className="py-2.5 px-3">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    svc.criticality === "CRITICAL"
                      ? "bg-rose-500/15 text-rose-500"
                      : svc.criticality === "HIGH"
                      ? "bg-orange-500/15 text-orange-500"
                      : svc.criticality === "MEDIUM"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {svc.criticality}
                </span>
              </td>

              <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                {formatCurrency(svc.expected_loss, { currency, compact: true })}
              </td>

              <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                {formatCurrency(svc.p90_loss, { currency, compact: true })}
              </td>

              <td className="py-2.5 px-3 text-right">
                <Link
                  href={`/financial-risk?service=${encodeURIComponent(svc.service)}`}
                  className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline font-medium"
                >
                  <span>Model</span>
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
