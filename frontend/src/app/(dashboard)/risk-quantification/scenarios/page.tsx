"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useThreatScenarios,
  useGenerateThreatScenarios,
} from "@/features/risk-quantification/hooks";
import { ScenarioTable } from "@/features/risk-quantification/components/ScenarioTable";
import { SimulationPanel } from "@/features/risk-quantification/components/SimulationPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Sparkles, Layers } from "lucide-react";

export default function ScenariosCatalogPage() {
  const [activeSimulationScenario, setActiveSimulationScenario] = useState<string | null>(null);
  const { data: scenarios, isLoading } = useThreatScenarios();
  const generateMutation = useGenerateThreatScenarios();

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/risk-quantification"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Cyber Threat Scenarios Catalog</h1>
            <p className="text-xs text-muted-foreground">
              Model realistic adversary attack scenarios to simulate business loss magnitudes and frequency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            isLoading={generateMutation.isPending}
            className="text-xs h-8 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Generate Baseline Templates</span>
          </Button>

          <Button size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/risk-quantification/scenarios/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Scenario</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Scenario Table */}
      <ScenarioTable
        scenarios={scenarios || []}
        isLoading={isLoading}
        onRunSimulation={(sc) => setActiveSimulationScenario(sc.id)}
      />

      {/* Simulation Trigger if selected */}
      {activeSimulationScenario && (
        <SimulationPanel
          assetVulnerabilityId={activeSimulationScenario}
          onSimulationCompleted={() => setActiveSimulationScenario(null)}
        />
      )}
    </div>
  );
}
