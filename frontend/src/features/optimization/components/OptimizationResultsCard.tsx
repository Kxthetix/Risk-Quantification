import React from "react";
import { OptimizationResult } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, TrendingDown, DollarSign, PieChart, ShieldCheck, GitBranch } from "lucide-react";

interface OptimizationResultsCardProps {
  result: OptimizationResult | null;
}

export function OptimizationResultsCard({ result }: OptimizationResultsCardProps) {
  if (!result) return null;

  const budgetUtilization = (result.total_cost / (result.budget || 1)) * 100;
  const riskReductionPct = result.baseline_risk_score
    ? ((result.baseline_risk_score - result.residual_risk_score) / result.baseline_risk_score) * 100
    : 0;

  return (
    <Card className="border-primary/30 bg-card/90 shadow-lg animate-in fade-in-0">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
                OPTIMAL DECISION SNAPSHOT
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Algorithm: {result.algorithm}
              </span>
            </div>
            <CardTitle className="text-base font-bold text-foreground mt-1">
              Optimal Portfolio Allocation ({result.selected_actions.length} Actions Selected)
            </CardTitle>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-muted-foreground block">Portfolio ROSI %</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              +{result.portfolio_rosi.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-4 text-xs">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block font-sans">Budget Allocated</span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(result.total_cost, { currency: "INR", compact: true })}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {budgetUtilization.toFixed(0)}% of {formatCurrency(result.budget, { currency: "INR", compact: true })}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 block font-sans">Annual Loss Avoidance</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(result.expected_loss_reduction, { currency: "INR", compact: true })}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">Direct Risk Attenuation</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground block font-sans">Residual Annual Loss</span>
            <span className="text-sm font-bold text-foreground">
              {formatCurrency(result.residual_loss, { currency: "INR", compact: true })}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Down from {formatCurrency(result.baseline_loss, { currency: "INR", compact: true })}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[10px] text-primary block font-sans">Residual Cyber Risk Score</span>
            <span className="text-sm font-bold text-primary">
              {result.residual_risk_score.toFixed(1)} / 100
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              -{riskReductionPct.toFixed(1)}% reduction
            </span>
          </div>
        </div>

        {/* Selected Actions Table */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Prioritized Portfolio Action Items
          </h4>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border text-[10px] uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Action Type</th>
                  <th className="px-3 py-2">Title / Security Measure</th>
                  <th className="px-3 py-2">Cost (₹)</th>
                  <th className="px-3 py-2">Loss Reduction (₹)</th>
                  <th className="px-3 py-2">ROSI %</th>
                  <th className="px-3 py-2 text-right">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {result.selected_actions.map((act, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-sans">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          act.action_type === "REMEDIATION"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {act.action_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-sans font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{act.title}</span>
                        {act.breaks_attack_path && (
                          <span className="text-[10px] px-1 rounded bg-amber-500/10 text-amber-400 font-mono">
                            Chokepoint Break
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatCurrency(act.cost, { currency: "INR", compact: true })}
                    </td>
                    <td className="px-3 py-2 font-semibold text-emerald-400">
                      {formatCurrency(act.expected_loss_reduction, { currency: "INR", compact: true })}
                    </td>
                    <td className="px-3 py-2 font-bold text-primary">
                      +{act.rosi_percentage.toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 text-right font-sans">
                      <span className="text-[10px] text-emerald-400 font-semibold">SELECTED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
