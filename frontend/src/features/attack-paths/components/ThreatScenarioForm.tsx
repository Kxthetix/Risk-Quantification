"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCreateThreatScenario } from "../hooks";
import { threatScenarioCreateSchema, ThreatScenarioCreateForm } from "../schemas";
import { DEFAULT_ATTACKER_PROFILES } from "../constants";
import { ShieldAlert, Save, Sparkles, Loader2 } from "lucide-react";

export interface ThreatScenarioFormProps {
  onSuccess?: () => void;
  initialValues?: Partial<ThreatScenarioCreateForm>;
}

export function ThreatScenarioForm({ onSuccess, initialValues }: ThreatScenarioFormProps) {
  const createScenario = useCreateThreatScenario();

  const form = useForm<ThreatScenarioCreateForm>({
    resolver: zodResolver(threatScenarioCreateSchema),
    defaultValues: {
      name: initialValues?.name || "",
      description: initialValues?.description || "",
      attacker_profile: initialValues?.attacker_profile || "EXTERNAL_ATTACKER",
      objective: initialValues?.objective || "Data Exfiltration & Ransomware Extortion",
      entry_point: initialValues?.entry_point || "Exposed VPN Gateway (CVE-2024-3094)",
      target_asset_name: initialValues?.target_asset_name || "Primary Financial Database",
      probability: initialValues?.probability ?? 0.65,
      confidence: initialValues?.confidence ?? 0.85,
      risk_score: initialValues?.risk_score ?? 78.0,
    },
  });

  const onSubmit = async (data: ThreatScenarioCreateForm) => {
    await createScenario.mutateAsync(data);
    onSuccess?.();
  };

  return (
    <Card className="border border-border bg-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">
              Adversary Threat Scenario Definition
            </CardTitle>
            <CardDescription className="text-xs">
              Synthesize attacker profiles, entry vectors, and objectives to simulate specific attack chains.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-foreground block">
              Scenario Name <span className="text-rose-500">*</span>
            </label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Ransomware Operator via Vulnerable Edge VPN"
              className="h-8 text-xs"
            />
            {form.formState.errors.name && (
              <p className="text-[10px] text-rose-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground block">
                Threat Actor Profile
              </label>
              <select
                {...form.register("attacker_profile")}
                className="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 h-8 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DEFAULT_ATTACKER_PROFILES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">
                Adversary Objective
              </label>
              <Input
                {...form.register("objective")}
                placeholder="e.g. Encrypt Core Databases & Exfiltrate PII"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-medium text-foreground block">
                Initial Entry Vector
              </label>
              <Input
                {...form.register("entry_point")}
                placeholder="e.g. DMZ WAF or VPN"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">
                Target Asset Name
              </label>
              <Input
                {...form.register("target_asset_name")}
                placeholder="e.g. Primary Payment DB"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-foreground block">
              Scenario Description / Context
            </label>
            <textarea
              {...form.register("description")}
              rows={2}
              placeholder="Describe hypothetical lateral movement, credential theft, and target impact..."
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={createScenario.isPending}
              className="gap-1.5 font-semibold text-xs"
            >
              {createScenario.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Threat Scenario</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
