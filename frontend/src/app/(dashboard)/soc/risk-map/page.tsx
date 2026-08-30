"use client";

import React from "react";
import { SOCRiskHeatmap } from "@/features/soc";
import { Button } from "@/components/ui/button";
import { Grid, RefreshCw } from "lucide-react";

export default function SOCRiskMapPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Grid className="w-7 h-7 text-indigo-400" />
          Operational Security Risk Matrix Heatmap
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic multi-dimensional risk map visualizing active threat concentrations across critical tier assets and financial exposure.
        </p>
      </div>

      <SOCRiskHeatmap />
    </div>
  );
}
