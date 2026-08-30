"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { controlRoiSchema, ControlRoiFormData } from "../schemas";
import { useControlScenarioROI } from "../hooks";
import { ControlScenarioResponse } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, ShieldCheck, ArrowRight } from "lucide-react";

export interface SecurityInvestmentViewProps {
  assetVulnerabilityId?: string;
}

export function SecurityInvestmentView({
  assetVulnerabilityId = "av-demo-01",
}: SecurityInvestmentViewProps) {
  const { currency } = useOrganization();
  const controlRoiMutation = useControlScenarioROI();
  const [roiResult, setRoiResult] = useState<ControlScenarioResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ControlRoiFormData>({
    resolver: zodResolver(controlRoiSchema),
    defaultValues: {
      control_name: "Web Application Firewall (WAF) & Automated Virtual Patching",
      implementation_cost: 1200000,
      risk_reduction_percentage: 0.45,
    },
  });

  const onSubmit = async (data: ControlRoiFormData) => {
    const res = await controlRoiMutation.mutateAsync({
      asset_vulnerability_id: assetVulnerabilityId,
      control_name: data.control_name,
      implementation_cost: data.implementation_cost,
      risk_reduction_percentage: data.risk_reduction_percentage,
    });
    setRoiResult(res);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          <CardTitle className="text-sm font-semibold">
            Security Control Investment &amp; ROI Optimizer
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Quantify the Return on Security Investment (ROSI %) and residual risk reduction delivered by defensive security controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Proposed Security Control" required error={errors.control_name?.message}>
              <Input {...register("control_name")} className="text-xs h-9" />
            </FormField>

            <FormField label="Implementation &amp; License Cost" required error={errors.implementation_cost?.message}>
              <Input type="number" {...register("implementation_cost")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Target Risk Reduction % (0.01 - 1.0)" required error={errors.risk_reduction_percentage?.message}>
              <Input
                type="number"
                step="0.05"
                min="0.01"
                max="1.0"
                {...register("risk_reduction_percentage")}
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={controlRoiMutation.isPending}
              className="h-8 text-xs gap-1.5"
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Calculate Control ROSI %</span>
            </Button>
          </div>
        </form>

        {roiResult && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in-0">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-foreground">{roiResult.control}</div>
              <span className="rounded bg-emerald-500 text-white px-2.5 py-0.5 text-xs font-black font-mono">
                {roiResult.roi.toFixed(1)}% ROSI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-muted-foreground block">Inherent Risk (EAL)</span>
                <strong className="text-xs text-foreground">
                  {formatCurrency(roiResult.baseline_expected_loss, { currency, compact: true })}
                </strong>
              </div>
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-amber-500 block">Implementation Cost</span>
                <strong className="text-xs text-amber-500">
                  {formatCurrency(roiResult.implementation_cost, { currency, compact: true })}
                </strong>
              </div>
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-emerald-500 block">Loss Reduction Value</span>
                <strong className="text-xs text-emerald-500">
                  {formatCurrency(roiResult.risk_reduction_value, { currency, compact: true })}
                </strong>
              </div>
              <div className="rounded bg-background p-2 border border-border">
                <span className="text-[9px] text-primary block">Residual Risk (EAL)</span>
                <strong className="text-xs text-primary">
                  {formatCurrency(roiResult.new_expected_loss, { currency, compact: true })}
                </strong>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
