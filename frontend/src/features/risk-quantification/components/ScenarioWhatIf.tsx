"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { whatIfSchema, WhatIfFormData } from "../schemas";
import { useWhatIfAnalysis } from "../hooks";
import { WhatIfResponse } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sliders, Sparkles, TrendingDown, ArrowRight } from "lucide-react";

export interface ScenarioWhatIfProps {
  assetVulnerabilityId?: string;
}

export function ScenarioWhatIf({
  assetVulnerabilityId = "av-demo-01",
}: ScenarioWhatIfProps) {
  const { currency } = useOrganization();
  const whatIfMutation = useWhatIfAnalysis();
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WhatIfFormData>({
    resolver: zodResolver(whatIfSchema),
    defaultValues: {
      downtime_hours: 4,
      recovery_hours: 6,
      dependency_factor: 0.5,
      incident_probability: 0.2,
    },
  });

  const onSubmit = async (data: WhatIfFormData) => {
    const res = await whatIfMutation.mutateAsync({
      asset_vulnerability_id: assetVulnerabilityId,
      downtime_hours: data.downtime_hours,
      recovery_hours: data.recovery_hours,
      dependency_factor: data.dependency_factor,
      incident_probability: data.incident_probability,
    });
    setResult(res);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <Sliders className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">What-If Hypothesis &amp; Stress Testing</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Simulate changes to architectural dependencies, recovery time objectives (RTO), and incident likelihood.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="What if Downtime is (Hours)">
              <Input type="number" step="0.5" {...register("downtime_hours")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="What if Recovery is (Hours)">
              <Input type="number" step="0.5" {...register("recovery_hours")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Dependency Factor (0.0 - 1.0)">
              <Input type="number" step="0.05" min="0" max="1" {...register("dependency_factor")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Incident Probability (0.0 - 1.0)">
              <Input type="number" step="0.05" min="0" max="1" {...register("incident_probability")} className="text-xs h-9 font-mono" />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={whatIfMutation.isPending} className="h-8 text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Simulate What-If Impact</span>
            </Button>
          </div>
        </form>

        {/* Results Card */}
        {result && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 animate-in fade-in-0">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Hypothesis Simulation Results</span>
              <span className="rounded bg-emerald-500 text-white px-2 py-0.5 text-[10px] font-bold font-mono">
                {result.percentage_reduction.toFixed(1)}% Loss Reduction
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center pt-1 font-mono">
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-muted-foreground block">Baseline Expected Loss</span>
                <strong className="text-xs text-foreground">
                  {formatCurrency(result.baseline_expected_loss, { currency, compact: true })}
                </strong>
              </div>
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-emerald-500 block">Projected New Loss</span>
                <strong className="text-xs text-emerald-500">
                  {formatCurrency(result.new_expected_loss, { currency, compact: true })}
                </strong>
              </div>
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-primary block">Annual Savings</span>
                <strong className="text-xs text-primary">
                  {formatCurrency(result.loss_reduction, { currency, compact: true })}
                </strong>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
