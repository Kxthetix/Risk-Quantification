"use client";

import React from "react";
import { FinancialAssumptionItem } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDateTime } from "@/lib/utils/date";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, ShieldCheck, History } from "lucide-react";

export interface FinancialAssumptionRegisterProps {
  assumptions?: FinancialAssumptionItem[];
}

export function FinancialAssumptionRegister({ assumptions = [] }: FinancialAssumptionRegisterProps) {
  const { currency } = useOrganization();

  const items: FinancialAssumptionItem[] =
    assumptions.length > 0
      ? assumptions
      : [
          {
            id: "fa-1",
            key: "revenue_per_hour",
            name: "Gross Operating Revenue per Hour",
            value: 450000,
            unit: `${currency} / Hour`,
            data_source: "INTERNAL_DATA",
            confidence: "HIGH",
            updated_at: new Date().toISOString(),
            owner: "Chief Financial Officer",
            history: [
              {
                previous_value: 400000,
                new_value: 450000,
                changed_by: "cfo@enterprise.internal",
                changed_at: new Date(Date.now() - 3600 * 1000 * 24 * 30).toISOString(),
                reason: "Q3 Annual revenue recalculation",
              },
            ],
          },
          {
            id: "fa-2",
            key: "downtime_cost_per_hour",
            name: "Average Outage Labor & Idle Productivity Cost",
            value: 180000,
            unit: `${currency} / Hour`,
            data_source: "INDUSTRY_BENCHMARK",
            confidence: "HIGH",
            updated_at: new Date().toISOString(),
            owner: "IT Operations Director",
            history: [],
          },
          {
            id: "fa-3",
            key: "cost_per_pii_record",
            name: "Cost per Compromised Customer PII Record",
            value: 250,
            unit: `${currency} / Record`,
            data_source: "INDUSTRY_BENCHMARK",
            confidence: "MEDIUM",
            updated_at: new Date().toISOString(),
            owner: "Legal & Compliance",
            history: [],
          },
          {
            id: "fa-4",
            key: "forensics_hourly_rate",
            name: "Emergency DFIR Retainer & Consulting Rate",
            value: 2500,
            unit: `${currency} / Hour`,
            data_source: "INTERNAL_DATA",
            confidence: "HIGH",
            updated_at: new Date().toISOString(),
            owner: "SecOps Lead",
            history: [],
          },
        ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">
            Enterprise Financial Assumptions &amp; Parameter Register
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Baseline financial metrics, revenue rates, and cost assumptions feeding the FAIR risk model.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-4">Financial Parameter</th>
                <th className="py-2.5 px-3">Configured Value</th>
                <th className="py-2.5 px-3">Data Source</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-4 text-right">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-foreground">
                    {item.name}
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                    {item.value.toLocaleString()} {item.unit}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {item.data_source.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        item.confidence === "HIGH"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {item.confidence}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-muted-foreground">{item.owner}</td>

                  <td className="py-2.5 px-4 text-right font-mono text-muted-foreground text-[11px]">
                    {formatDateTime(item.updated_at)}
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
