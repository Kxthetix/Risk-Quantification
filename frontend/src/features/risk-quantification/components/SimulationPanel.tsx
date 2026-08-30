"use client";

import React, { useState } from "react";
import { SIMULATION_ITERATION_OPTIONS } from "../constants";
import { useCalculateFinancialLoss, useSimulationStatus } from "../hooks";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Cpu, RefreshCw, CheckCircle2, AlertCircle, StopCircle } from "lucide-react";

export interface SimulationPanelProps {
  assetVulnerabilityId?: string;
  onSimulationCompleted?: (jobId: string) => void;
}

export function SimulationPanel({
  assetVulnerabilityId = "av-demo-01",
  onSimulationCompleted,
}: SimulationPanelProps) {
  const [simulationCount, setSimulationCount] = useState(50000);
  const [randomSeed, setRandomSeed] = useState(42);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const calculateMutation = useCalculateFinancialLoss();
  const { data: jobStatus } = useSimulationStatus(activeJobId || undefined);

  const handleStartSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await calculateMutation.mutateAsync({
      asset_vulnerability_id: assetVulnerabilityId,
      simulation_count: simulationCount,
      random_seed: randomSeed,
      synchronous: true,
    });
    setActiveJobId(res.job_id);
    if (onSimulationCompleted) {
      onSimulationCompleted(res.job_id);
    }
  };

  const isRunning =
    jobStatus?.status === "RUNNING" || jobStatus?.status === "QUEUED";
  const isCompleted = jobStatus?.status === "COMPLETED";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Cpu className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">Monte Carlo Simulation Engine</CardTitle>
          </div>
          {jobStatus && (
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                isCompleted
                  ? "bg-emerald-500/15 text-emerald-500"
                  : isRunning
                  ? "bg-primary/15 text-primary animate-pulse"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {jobStatus.status}
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          Execute probabilistic numerical simulations to quantify Value at Risk and loss exceedance bounds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <form onSubmit={handleStartSimulation} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <FormField label="Simulation Runs (Iterations)">
            <select
              value={simulationCount}
              onChange={(e) => setSimulationCount(Number(e.target.value))}
              disabled={isRunning}
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
            <Input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(Number(e.target.value))}
              disabled={isRunning}
              className="text-xs h-9 font-mono"
            />
          </FormField>

          <Button
            type="submit"
            size="sm"
            isLoading={calculateMutation.isPending || isRunning}
            className="h-9 gap-1.5"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{isRunning ? "Simulating..." : "Execute Simulation"}</span>
          </Button>
        </form>

        {/* Live Progress Bar if active */}
        {jobStatus && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-muted-foreground font-mono">
                Progress: {jobStatus.simulations_completed?.toLocaleString()} / {jobStatus.total_simulations?.toLocaleString()} runs
              </span>
              <span className="font-bold font-mono text-foreground">{jobStatus.progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
