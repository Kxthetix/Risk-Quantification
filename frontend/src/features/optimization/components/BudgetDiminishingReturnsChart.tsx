import React from "react";
import { BudgetCurvePoint } from "../types";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";

interface BudgetDiminishingReturnsChartProps {
  points: BudgetCurvePoint[];
  optimalInflection?: number;
  isLoading?: boolean;
}

export function BudgetDiminishingReturnsChart({
  points,
  optimalInflection,
  isLoading,
}: BudgetDiminishingReturnsChartProps) {
  if (points.length === 0 && !isLoading) return null;

  const maxLossReduction = Math.max(...points.map((p) => p.expected_loss_reduction || 1), 1);
  const maxBudget = Math.max(...points.map((p) => p.budget || 1), 1);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Budget vs. Risk Reduction Optimization Curve
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Empirical curve identifying diminishing returns and the optimal investment frontier.
            </CardDescription>
          </div>

          {optimalInflection && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimal Budget: {formatCurrency(optimalInflection, { currency: "INR", compact: true })}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {isLoading ? (
          <div className="h-48 rounded-lg bg-muted/30 animate-pulse" />
        ) : (
          <div className="space-y-4">
            {/* Visual Point Bars */}
            <div className="space-y-2 font-mono">
              {points.map((pt, idx) => {
                const lossPct = (pt.expected_loss_reduction / maxLossReduction) * 100;
                const isOptimal = pt.is_inflection_point || pt.budget === optimalInflection;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border transition-colors ${
                      isOptimal
                        ? "bg-primary/10 border-primary/40"
                        : "bg-muted/20 border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-foreground font-sans flex items-center gap-2">
                        <span>Budget: {formatCurrency(pt.budget, { currency: "INR", compact: true })}</span>
                        {isOptimal && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-primary text-primary-foreground">
                            OPTIMAL POINT
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        Loss Reduction: {formatCurrency(pt.expected_loss_reduction, { currency: "INR", compact: true })} (+{pt.portfolio_rosi.toFixed(0)}% ROSI)
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOptimal ? "bg-primary" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.max(lossPct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
