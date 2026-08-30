"use client";

import React, { useState } from "react";
import { FinancialDistribution, FinancialPercentiles } from "@/types/financial";
import { formatCurrency } from "@/lib/utils/currency";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, HelpCircle } from "lucide-react";

export interface LossDistributionChartProps {
  distribution?: FinancialDistribution;
  percentiles?: FinancialPercentiles;
  title?: string;
  description?: string;
}

export function LossDistributionChart({
  distribution,
  percentiles,
  title = "Monte Carlo Simulated Loss Distribution",
  description = "Probability Density Function (PDF) and Loss Exceedance Curve showing likelihood of financial breach magnitudes across 10,000+ simulation iterations.",
}: LossDistributionChartProps) {
  const { currency } = useOrganization();
  const [chartMode, setChartMode] = useState<"PDF" | "LEC">("PDF");

  const defaultBins = [0, 1000000, 2500000, 5000000, 7500000, 10000000, 15000000, 20000000, 25000000, 30000000];
  const defaultFrequencies = [450, 1280, 2450, 3120, 1850, 920, 480, 190, 70, 25];

  const bins = distribution?.bins?.length ? distribution.bins : defaultBins;
  const frequencies = distribution?.frequencies?.length
    ? distribution.frequencies
    : defaultFrequencies;

  const maxFreq = Math.max(...frequencies, 1);
  const totalSims = frequencies.reduce((a, b) => a + b, 0);

  // Cumulative exceedance probabilities for LEC
  let accumulated = 0;
  const exceedanceData = frequencies.map((freq, i) => {
    const probExceed = Math.max(0, (totalSims - accumulated) / totalSims);
    accumulated += freq;
    return {
      loss: bins[i] || 0,
      prob: probExceed,
    };
  });

  const p50 = percentiles?.p50 ?? 6200000;
  const p90 = percentiles?.p90 ?? 14800000;
  const p95 = percentiles?.p95 ?? 18300000;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
            <Button
              variant={chartMode === "PDF" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartMode("PDF")}
              className="h-7 text-xs px-2.5"
            >
              Density (PDF)
            </Button>
            <Button
              variant={chartMode === "LEC" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartMode("LEC")}
              className="h-7 text-xs px-2.5"
            >
              Exceedance (LEC)
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SVG Visualization */}
        <div className="relative h-64 w-full rounded-lg border border-border bg-muted/10 p-4">
          {/* Top percentile indicators */}
          <div className="absolute top-2 right-4 flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              P50: {formatCurrency(p50, { currency, compact: true })}
            </span>
            <span className="flex items-center gap-1 text-orange-500">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              P90: {formatCurrency(p90, { currency, compact: true })}
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              P95: {formatCurrency(p95, { currency, compact: true })}
            </span>
          </div>

          <svg className="h-full w-full overflow-visible" viewBox="0 0 600 220">
            {/* Grid Lines */}
            <line x1="50" y1="50" x2="570" y2="50" stroke="currentColor" strokeDasharray="3 3" className="text-border" />
            <line x1="50" y1="110" x2="570" y2="110" stroke="currentColor" strokeDasharray="3 3" className="text-border" />
            <line x1="50" y1="170" x2="570" y2="170" stroke="currentColor" strokeDasharray="3 3" className="text-border" />

            {/* Axes */}
            <line x1="50" y1="190" x2="570" y2="190" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
            <line x1="50" y1="20" x2="50" y2="190" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />

            {/* Axis Labels */}
            <text x="310" y="212" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
              Simulated Financial Loss ({currency})
            </text>
            <text x="-105" y="18" transform="rotate(-90)" textAnchor="middle" className="text-[10px] fill-muted-foreground font-mono">
              {chartMode === "PDF" ? "Relative Frequency" : "Probability of Exceedance"}
            </text>

            {/* Chart Mode PDF: Histogram Bars & Smooth Curve */}
            {chartMode === "PDF" &&
              frequencies.map((freq, i) => {
                const barWidth = 46;
                const x = 60 + i * 50;
                const barHeight = (freq / maxFreq) * 150;
                const y = 190 - barHeight;
                const isTailRisk = i >= 6;

                return (
                  <g key={i} className="group cursor-pointer">
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      className={`transition-all duration-300 ${
                        isTailRisk
                          ? "fill-rose-500/30 group-hover:fill-rose-500/60 stroke-rose-500/50"
                          : "fill-primary/30 group-hover:fill-primary/60 stroke-primary/50"
                      }`}
                    />
                    <text
                      x={x + barWidth / 2}
                      y={202}
                      textAnchor="middle"
                      className="text-[8px] fill-muted-foreground font-mono"
                    >
                      {formatCurrency(bins[i] || 0, { currency, compact: true })}
                    </text>
                  </g>
                );
              })}

            {/* Chart Mode LEC: Loss Exceedance Curve */}
            {chartMode === "LEC" && (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-rose-500"
                points={exceedanceData
                  .map((pt, i) => {
                    const x = 60 + i * 50;
                    const y = 190 - pt.prob * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            )}
          </svg>
        </div>

        {/* Text Alternative for Screen Readers & Clarity */}
        <div className="rounded bg-muted/20 p-2.5 text-[11px] text-muted-foreground border border-border/40 font-mono">
          Summary: 50% probability of loss exceeding {formatCurrency(p50, { currency })}, 10% probability of loss exceeding {formatCurrency(p90, { currency })}, and 5% tail risk exceeding {formatCurrency(p95, { currency })}.
        </div>
      </CardContent>
    </Card>
  );
}
