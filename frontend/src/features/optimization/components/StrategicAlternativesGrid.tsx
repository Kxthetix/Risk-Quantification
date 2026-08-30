import React from "react";
import { StrategicAlternative } from "../types";
import { STRATEGIC_PORTFOLIO_DESCRIPTIONS } from "../constants";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, Sparkles, Zap, Shield, Target } from "lucide-react";

interface StrategicAlternativesGridProps {
  alternatives: StrategicAlternative[];
  onSelectAlternative?: (alt: StrategicAlternative) => void;
  isLoading?: boolean;
}

export function StrategicAlternativesGrid({
  alternatives,
  onSelectAlternative,
  isLoading,
}: StrategicAlternativesGridProps) {
  if (alternatives.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Strategic Investment Portfolio Alternatives
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Side-by-side comparison of 4 distinct capital allocation strategies for executive decision-makers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 rounded-xl bg-muted/30 animate-pulse border border-border" />
            ))
          : alternatives.map((alt) => {
              const meta =
                STRATEGIC_PORTFOLIO_DESCRIPTIONS[alt.code] ||
                STRATEGIC_PORTFOLIO_DESCRIPTIONS.BALANCED;

              return (
                <Card
                  key={alt.code}
                  className={`border flex flex-col justify-between transition-all hover:shadow-md ${
                    alt.recommended
                      ? "border-primary shadow-primary/10 ring-1 ring-primary/40 bg-card"
                      : "border-border bg-card/60"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta.badge}`}>
                        {meta.tag}
                      </span>
                      {alt.recommended && (
                        <span className="text-[10px] text-primary font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Recommended
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xs font-bold text-foreground mt-2">
                      {alt.name}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-muted-foreground line-clamp-2">
                      {alt.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-2 text-xs">
                    <div className="space-y-1.5 font-mono">
                      <div className="flex items-center justify-between border-b border-border/50 pb-1">
                        <span className="text-muted-foreground text-[11px]">Investment Spend</span>
                        <span className="font-bold text-foreground">
                          {formatCurrency(alt.total_cost, { currency: "INR", compact: true })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/50 pb-1">
                        <span className="text-muted-foreground text-[11px]">Loss Reduction</span>
                        <span className="font-bold text-emerald-400">
                          {formatCurrency(alt.expected_loss_reduction, { currency: "INR", compact: true })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-border/50 pb-1">
                        <span className="text-muted-foreground text-[11px]">Portfolio ROSI</span>
                        <span className="font-bold text-primary">
                          +{alt.portfolio_rosi.toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-muted-foreground text-[11px]">Residual Risk</span>
                        <span className="font-bold text-foreground">
                          {alt.residual_risk_score.toFixed(1)} / 100
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        variant={alt.recommended ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectAlternative && onSelectAlternative(alt)}
                        className="w-full text-xs h-8"
                      >
                        {alt.recommended ? "Select Recommended Portfolio" : "Review Portfolio"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
