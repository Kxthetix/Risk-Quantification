"use client";

import React from "react";
import Link from "next/link";
import { useThreatScenarios, useGenerateThreatScenarios } from "@/features/attack-paths/hooks";
import { ThreatScenarioTable } from "@/features/attack-paths/components/ThreatScenarioTable";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Plus,
  Sparkles,
  GitCompare,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function ThreatModelsPage() {
  const { data: scenarios, isLoading, refetch } = useThreatScenarios();
  const generateScenarios = useGenerateThreatScenarios();

  const handleGenerate = async () => {
    await generateScenarios.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">
              Adversary Threat Modeling &amp; Scenarios
            </h1>
            <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-400">
              Scenario Synthesis
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model structured attacker profiles, targeted business objectives, and hypothetical kill-chain paths.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generateScenarios.isPending}
            className="text-xs h-8 gap-1.5"
          >
            {generateScenarios.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            )}
            <span>Auto-Generate Templates</span>
          </Button>

          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/threat-models/compare">
              <GitCompare className="h-3.5 w-3.5 text-amber-400" />
              <span>Compare Scenarios</span>
            </Link>
          </Button>

          <Button size="sm" asChild className="text-xs h-8 gap-1.5 font-semibold">
            <Link href="/threat-models/new">
              <Plus className="h-3.5 w-3.5" />
              <span>New Threat Scenario</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Scenarios Table */}
      <ThreatScenarioTable
        scenarios={scenarios}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />
    </div>
  );
}
