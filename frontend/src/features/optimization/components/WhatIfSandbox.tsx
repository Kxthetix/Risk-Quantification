import React, { useState } from "react";
import { WhatIfOptimizationResponse } from "../types";
import { useWhatIfOptimization } from "../hooks";
import { useRemediations } from "@/features/remediation/hooks";
import { useControls } from "@/features/controls/hooks";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sliders, DollarSign, TrendingDown, CheckSquare, Square, RotateCcw } from "lucide-react";

export function WhatIfSandbox() {
  const { data: remData } = useRemediations();
  const { data: controls = [] } = useControls();
  const whatIfMutation = useWhatIfOptimization();

  const [selectedRemIds, setSelectedRemIds] = useState<string[]>([]);
  const [selectedCtrlIds, setSelectedCtrlIds] = useState<string[]>([]);
  const [result, setResult] = useState<WhatIfOptimizationResponse | null>(null);

  const remediations = remData?.remediations || [];

  const toggleRem = (id: string) => {
    setSelectedRemIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCtrl = (id: string) => {
    setSelectedCtrlIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSimulate = async () => {
    const res = await whatIfMutation.mutateAsync({
      remediation_ids: selectedRemIds,
      control_ids: selectedCtrlIds,
      horizon_years: 1,
    });
    setResult(res);
  };

  const handleReset = () => {
    setSelectedRemIds([]);
    setSelectedCtrlIds([]);
    setResult(null);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Custom Mitigation Package Simulator (What-If Sandbox)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Manually compose a tailored bundle of remediations and controls to test projected portfolio impact.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 text-xs gap-1">
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSimulate}
              isLoading={whatIfMutation.isPending}
              disabled={selectedRemIds.length === 0 && selectedCtrlIds.length === 0}
              className="h-8 text-xs"
            >
              Simulate Custom Package
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Remediations Checklist */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground block uppercase text-[10px] tracking-wider">
              Available Remediations ({remediations.length})
            </span>
            <div className="rounded-lg border border-border bg-muted/20 p-2 max-h-48 overflow-y-auto space-y-1.5 font-sans">
              {remediations.map((rem) => {
                const isSelected = selectedRemIds.includes(rem.id);
                return (
                  <div
                    key={rem.id}
                    onClick={() => toggleRem(rem.id)}
                    className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <div>
                        <span className="font-medium text-foreground block line-clamp-1">
                          {rem.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {rem.remediation_type} • {formatCurrency(rem.estimated_cost, { currency: "INR", compact: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Checklist */}
          <div className="space-y-2">
            <span className="font-semibold text-foreground block uppercase text-[10px] tracking-wider">
              Defensive Controls ({controls.length})
            </span>
            <div className="rounded-lg border border-border bg-muted/20 p-2 max-h-48 overflow-y-auto space-y-1.5 font-sans">
              {controls.map((ctrl) => {
                const isSelected = selectedCtrlIds.includes(ctrl.id);
                return (
                  <div
                    key={ctrl.id}
                    onClick={() => toggleCtrl(ctrl.id)}
                    className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : "bg-card border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <div>
                        <span className="font-medium text-foreground block line-clamp-1">
                          {ctrl.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {ctrl.control_type} • {formatCurrency(ctrl.annual_cost, { currency: "INR", compact: true })}/yr
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Simulation Results */}
        {result && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 animate-in fade-in-0 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="font-sans font-bold text-foreground">Custom Package Simulation Outcome</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-white text-xs font-bold">
                +{result.portfolio_rosi.toFixed(1)}% ROSI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9px] text-muted-foreground block font-sans">Combined Total Cost</span>
                <span className="font-bold text-amber-400">
                  {formatCurrency(result.total_cost, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9px] text-muted-foreground block font-sans">Total Loss Reduction</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(result.expected_loss_reduction, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9px] text-muted-foreground block font-sans">Residual Annual Loss</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(result.residual_expected_loss, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-2 rounded bg-card border border-border">
                <span className="text-[9px] text-muted-foreground block font-sans">Residual Risk Score</span>
                <span className="font-bold text-primary">
                  {result.residual_risk_score.toFixed(1)} / 100
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
