"use client";

import React from "react";
import { RiskAppetiteSettings } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, CheckCircle2, AlertTriangle, Scale } from "lucide-react";

export interface RiskAppetiteCardProps {
  settings?: RiskAppetiteSettings;
}

export function RiskAppetiteCard({ settings }: RiskAppetiteCardProps) {
  const { currency } = useOrganization();

  const data: RiskAppetiteSettings = settings || {
    max_expected_annual_loss: 40000000,
    max_single_loss: 50000000,
    max_p95_loss: 60000000,
    max_service_exposure: 20000000,
    current_eal: 48200000,
    is_breached: true,
    breach_excess: 8200000,
    currency,
  };

  const pct = Math.min((data.current_eal / data.max_expected_annual_loss) * 100, 150);

  return (
    <Card className={`border-border bg-card ${data.is_breached ? "border-rose-500/40" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Scale className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">
              Board Risk Appetite &amp; Tolerance Thresholds
            </CardTitle>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              data.is_breached
                ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                : "bg-emerald-500/15 text-emerald-500"
            }`}
          >
            {data.is_breached ? "⚠️ Risk Appetite Exceeded" : "✓ Within Risk Tolerance"}
          </span>
        </div>
        <CardDescription className="text-xs">
          Compares current probabilistic Annual Expected Loss against board-mandated cyber risk limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        {/* Gauge Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between font-mono font-semibold">
            <span className="text-muted-foreground">Current Portfolio EAL: {formatCurrency(data.current_eal, { currency, compact: true })}</span>
            <span className="text-rose-500">Tolerance Cap: {formatCurrency(data.max_expected_annual_loss, { currency, compact: true })}</span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-muted/40 relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.is_breached ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Breach Alert Notice */}
        {data.is_breached && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-rose-600 dark:text-rose-400">
                Risk Appetite Limit Exceeded by {formatCurrency(data.breach_excess, { currency, compact: true })}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Organizational cybersecurity exposure exceeds executive risk appetite. Immediate remediation or formal board risk acceptance required.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
