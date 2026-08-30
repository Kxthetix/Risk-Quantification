"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDown, ArrowUp, DollarSign } from "lucide-react";

export interface FinancialImpactWaterfallProps {
  downtime?: number;
  revenue?: number;
  recovery?: number;
  regulatory?: number;
  insuranceOffset?: number;
}

export function FinancialImpactWaterfall({
  downtime = 18400000,
  revenue = 11200000,
  recovery = 7800000,
  regulatory = 7000000,
  insuranceOffset = 12000000,
}: FinancialImpactWaterfallProps) {
  const { currency } = useOrganization();

  const grossLoss = downtime + revenue + recovery + regulatory;
  const netLoss = Math.max(0, grossLoss - insuranceOffset);

  const steps = [
    { label: "Operational Downtime", val: downtime, type: "ADD", color: "text-amber-500" },
    { label: "Direct Revenue Impact", val: revenue, type: "ADD", color: "text-rose-500" },
    { label: "Recovery & Response", val: recovery, type: "ADD", color: "text-blue-500" },
    { label: "Regulatory Fines & Legal", val: regulatory, type: "ADD", color: "text-purple-500" },
    { label: "Gross Financial Loss", val: grossLoss, type: "TOTAL", color: "text-foreground font-bold" },
    { label: "Cyber Insurance Recovery", val: -insuranceOffset, type: "SUBTRACT", color: "text-emerald-500" },
    { label: "Net Financial Exposure", val: netLoss, type: "NET", color: "text-rose-600 dark:text-rose-400 font-extrabold" },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-primary">
          <DollarSign className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">
            Financial Impact Waterfall &amp; Insurance Offset
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Component-level loss build-up and net retained loss exposure after insurance policy recovery.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 text-xs">
          {steps.map((step) => (
            <div
              key={step.label}
              className={`rounded-lg border p-2.5 space-y-1 ${
                step.type === "NET"
                  ? "border-rose-500/50 bg-rose-500/10"
                  : step.type === "TOTAL"
                  ? "border-border bg-muted/40"
                  : "border-border/50 bg-muted/15"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">{step.label}</span>
                {step.type === "ADD" && <ArrowUp className="h-3 w-3 text-rose-500" />}
                {step.type === "SUBTRACT" && <ArrowDown className="h-3 w-3 text-emerald-500" />}
              </div>
              <div className={`text-sm font-mono ${step.color}`}>
                {formatCurrency(step.val, { currency, compact: true })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
