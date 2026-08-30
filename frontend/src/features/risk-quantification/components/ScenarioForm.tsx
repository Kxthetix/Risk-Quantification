"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scenarioCreateSchema, ScenarioCreateFormData } from "../schemas";
import { SCENARIO_CATEGORY_OPTIONS, SIMULATION_ITERATION_OPTIONS } from "../constants";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Layers, DollarSign, Clock, ShieldAlert, Cpu } from "lucide-react";

export interface ScenarioFormProps {
  initialValues?: Partial<ScenarioCreateFormData>;
  onSubmit: (data: ScenarioCreateFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ScenarioForm({
  initialValues,
  onSubmit,
  isLoading = false,
  onCancel,
}: ScenarioFormProps) {
  const { currency } = useOrganization();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ScenarioCreateFormData>({
    resolver: zodResolver(scenarioCreateSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      category: initialValues?.category || "RANSOMWARE",
      business_service_id: initialValues?.business_service_id || "",
      risk_owner: initialValues?.risk_owner || "Security Operations Lead",
      status: initialValues?.status || "ACTIVE",
      affected_asset_ids: initialValues?.affected_asset_ids || [],
      frequency_method: initialValues?.frequency_method || "ARO",
      annual_rate_of_occurrence: initialValues?.annual_rate_of_occurrence || 0.35,
      expected_downtime_hours: initialValues?.expected_downtime_hours || 12,
      recovery_cost: initialValues?.recovery_cost || 1500000,
      data_breach_records: initialValues?.data_breach_records || 25000,
      cost_per_record: initialValues?.cost_per_record || 250,
      potential_regulatory_fine: initialValues?.potential_regulatory_fine || 1000000,
      legal_and_consulting_cost: initialValues?.legal_and_consulting_cost || 500000,
      customer_compensation: initialValues?.customer_compensation || 300000,
      third_party_penalty: initialValues?.third_party_penalty || 200000,
      insurance_recovery_limit: initialValues?.insurance_recovery_limit || 2000000,
      insurance_deductible: initialValues?.insurance_deductible || 250000,
      simulation_count: initialValues?.simulation_count || 50000,
      random_seed: initialValues?.random_seed || 42,
    },
  });

  const selectedMethod = watch("frequency_method");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-xs">
      {/* 1. Scenario Identification */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Layers className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">1. Scenario Definition &amp; Scope</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Identify the threat vector, associated business workflow, and operational status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Threat Scenario Name" required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="e.g. Double-Extortion Ransomware on Core Payment Gateways"
              className="text-xs h-9"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Threat Category" required error={errors.category?.message}>
              <select
                {...register("category")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SCENARIO_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned Risk Owner" error={errors.risk_owner?.message}>
              <Input {...register("risk_owner")} className="text-xs h-9" />
            </FormField>

            <FormField label="Lifecycle Status" required error={errors.status?.message}>
              <select
                {...register("status")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE" className="bg-popover text-popover-foreground">Active Model</option>
                <option value="DRAFT" className="bg-popover text-popover-foreground">Draft</option>
                <option value="ARCHIVED" className="bg-popover text-popover-foreground">Archived</option>
              </select>
            </FormField>
          </div>

          <FormField label="Threat Narrative &amp; Attack Vector Description" error={errors.description?.message}>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Describe adversary initial access, lateral movement, payload detonation, and business impact..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* 2. Frequency & Likelihood Modeling */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-amber-500">
            <Clock className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">2. Incident Frequency Estimation</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Estimate expected occurrence rate per calendar year using Poisson or three-point beta distributions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Frequency Estimation Method">
              <select
                {...register("frequency_method")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ARO" className="bg-popover text-popover-foreground">Direct Annual Rate of Occurrence (ARO)</option>
                <option value="HISTORICAL" className="bg-popover text-popover-foreground">Historical Incident Rate</option>
                <option value="EXPERT" className="bg-popover text-popover-foreground">3-Point Expert Estimate (Min / Mode / Max)</option>
              </select>
            </FormField>

            <FormField
              label="Annual Rate of Occurrence (Events / Year)"
              required
              error={errors.annual_rate_of_occurrence?.message}
            >
              <Input
                type="number"
                step="0.01"
                {...register("annual_rate_of_occurrence")}
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          {selectedMethod === "EXPERT" && (
            <div className="grid grid-cols-3 gap-3 bg-muted/20 p-3 rounded-lg border border-border/40">
              <FormField label="Minimum Rate (P10)">
                <Input type="number" step="0.01" {...register("frequency_min")} className="text-xs h-8 font-mono" />
              </FormField>
              <FormField label="Most Likely Rate (Mode)">
                <Input type="number" step="0.01" {...register("frequency_mode")} className="text-xs h-8 font-mono" />
              </FormField>
              <FormField label="Maximum Rate (P90)">
                <Input type="number" step="0.01" {...register("frequency_max")} className="text-xs h-8 font-mono" />
              </FormField>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Loss Magnitude Breakdown */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-rose-500">
            <DollarSign className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">3. Financial Loss Magnitude Components ({currency})</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Parameterize direct operational downtime, forensics, regulatory penalties, and insurance recovery limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Expected Downtime (Hours)">
              <Input type="number" {...register("expected_downtime_hours")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Recovery &amp; Incident Response Cost">
              <Input type="number" {...register("recovery_cost")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Compromised PII Records Count">
              <Input type="number" {...register("data_breach_records")} className="text-xs h-9 font-mono" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Cost Per Compromised Record">
              <Input type="number" {...register("cost_per_record")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Potential Regulatory Fine (GDPR / DPDPA)">
              <Input type="number" {...register("potential_regulatory_fine")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Legal, Consulting &amp; PR Costs">
              <Input type="number" {...register("legal_and_consulting_cost")} className="text-xs h-9 font-mono" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-border/40 pt-3">
            <FormField label="Cyber Insurance Coverage Limit">
              <Input type="number" {...register("insurance_recovery_limit")} className="text-xs h-9 font-mono" />
            </FormField>

            <FormField label="Insurance Policy Deductible">
              <Input type="number" {...register("insurance_deductible")} className="text-xs h-9 font-mono" />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* 4. Monte Carlo Simulation Configuration */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-blue-500">
            <Cpu className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">4. Monte Carlo Simulation Engine Parameters</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Configure convergence sample sizes and reproducible pseudo-random seeds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Simulation Runs Count">
              <select
                {...register("simulation_count")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SIMULATION_ITERATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Random Seed (Reproducibility)">
              <Input type="number" {...register("random_seed")} className="text-xs h-9 font-mono" />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isLoading}>
          Save Scenario &amp; Run Monte Carlo
        </Button>
      </div>
    </form>
  );
}
