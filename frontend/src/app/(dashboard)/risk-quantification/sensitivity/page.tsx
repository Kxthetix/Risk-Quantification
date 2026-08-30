"use client";

import React from "react";
import Link from "next/link";
import { SensitivityTornadoChart } from "@/features/risk-quantification/components/SensitivityTornadoChart";
import { ScenarioWhatIf } from "@/features/risk-quantification/components/ScenarioWhatIf";
import { ArrowLeft, BarChart2, Sliders } from "lucide-react";

export default function SensitivityAnalysisPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risk-quantification"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Sensitivity Analysis &amp; Stress Testing</h1>
          <p className="text-xs text-muted-foreground">
            Evaluate which operational variables exert the largest swing on annualized cyber loss exposure.
          </p>
        </div>
      </div>

      {/* Tornado Chart */}
      <SensitivityTornadoChart />

      {/* What-If Simulator */}
      <ScenarioWhatIf />
    </div>
  );
}
