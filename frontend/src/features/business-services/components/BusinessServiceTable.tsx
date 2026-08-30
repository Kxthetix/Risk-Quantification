"use client";

import React from "react";
import Link from "next/link";
import { BusinessService } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { formatNumber } from "@/lib/utils/number";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Briefcase, ArrowUpRight, ShieldAlert, Layers } from "lucide-react";

export interface BusinessServiceTableProps {
  services: BusinessService[];
  isLoading?: boolean;
}

export function BusinessServiceTable({
  services,
  isLoading = false,
}: BusinessServiceTableProps) {
  const { currency } = useOrganization();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-xs text-muted-foreground animate-pulse">
        Loading business services catalog...
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <Briefcase className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-foreground">No business services defined</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
          Map your business processes (e.g. Payment Processing, Identity, ERP) to quantify revenue at risk.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="border-b border-border bg-muted/30 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-3">Business Workflow / Service</th>
              <th className="py-3 px-3">Criticality</th>
              <th className="py-3 px-3 text-center">Revenue Dependency</th>
              <th className="py-3 px-3 text-right">Daily Transactions</th>
              <th className="py-3 px-3 text-right">Avg Value</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-muted/30 transition-colors group">
                <td className="py-3 px-3 font-semibold text-foreground">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <div className="font-semibold text-foreground">{svc.name}</div>
                      {svc.description && (
                        <p className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                          {svc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="py-3 px-3">
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

                <td className="py-3 px-3 text-center font-mono font-medium">
                  {(svc.revenue_dependency * 100).toFixed(0)}%
                </td>

                <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                  {formatNumber(svc.daily_transaction_count || 0)}
                </td>

                <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                  {formatCurrency(svc.average_transaction_value || 0, { currency, compact: true })}
                </td>

                <td className="py-3 px-3 text-right">
                  <Link
                    href={`/financial-risk?service=${encodeURIComponent(svc.name)}`}
                    className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                  >
                    <span>Simulate</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
