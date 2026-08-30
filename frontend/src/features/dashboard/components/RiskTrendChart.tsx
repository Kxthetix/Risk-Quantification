"use client";

import React, { useState } from "react";
import { TimeSeriesPoint } from "../types";
import { formatScore } from "@/lib/utils/number";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export interface RiskTrendChartProps {
  points?: TimeSeriesPoint[];
  trendDirection?: "IMPROVING" | "WORSENING" | "STABLE" | "UP" | "DOWN";
  percentageChange?: number;
  period: "7d" | "30d" | "90d" | "1y";
  onPeriodChange?: (period: "7d" | "30d" | "90d" | "1y") => void;
}

export function RiskTrendChart({
  points = [],
  trendDirection = "WORSENING",
  percentageChange = 3.8,
  period,
  onPeriodChange,
}: RiskTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TimeSeriesPoint | null>(null);

  // Fallback if data points are empty
  const chartData =
    points.length > 0
      ? points
      : [
          { date: "Day 1", risk_score: 72.1 },
          { date: "Day 5", risk_score: 73.4 },
          { date: "Day 10", risk_score: 75.0 },
          { date: "Day 15", risk_score: 74.2 },
          { date: "Day 20", risk_score: 77.8 },
          { date: "Day 25", risk_score: 76.5 },
          { date: "Day 30", risk_score: 78.4 },
        ];

  const minScore = Math.max(0, Math.min(...chartData.map((d) => d.risk_score)) - 5);
  const maxScore = Math.min(100, Math.max(...chartData.map((d) => d.risk_score)) + 5);
  const scoreRange = maxScore - minScore || 1;

  // Chart dimensions
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getCoordinates = (index: number, score: number) => {
    const x = paddingX + (index / (chartData.length - 1 || 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((score - minScore) / scoreRange) * (height - 2 * paddingY);
    return { x, y };
  };

  const polylinePoints = chartData
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.risk_score);
      return `${x},${y}`;
    })
    .join(" ");

  const isImproving = trendDirection === "IMPROVING" || trendDirection === "DOWN";

  return (
    <div className="flex flex-col justify-between h-full space-y-3">
      {/* Header with period toggle & velocity */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Historical Trajectory:</span>
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isImproving ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isImproving ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            <span>
              {isImproving ? "-" : "+"}
              {Math.abs(percentageChange)}% velocity
            </span>
          </div>
        </div>

        {onPeriodChange && (
          <div className="inline-flex rounded-md border border-border/70 bg-muted/40 p-0.5 text-[10px]">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange(p)}
                className={`rounded px-2 py-0.5 font-medium transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full h-[180px] bg-muted/10 rounded-lg p-1 border border-border/40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Risk score trend over time chart"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = paddingY + ratio * (height - 2 * paddingY);
            const val = maxScore - ratio * scoreRange;
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-border/50"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-muted-foreground font-mono"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Trend Polyline */}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Interactive Data Points */}
          {chartData.map((d, i) => {
            const { x, y } = getCoordinates(i, d.risk_score);
            const isHovered = hoveredPoint?.date === d.date;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "5" : "3.5"}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  className="cursor-pointer transition-all hover:scale-125"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 rounded-md border border-border bg-popover px-2.5 py-1 text-xs shadow-md text-popover-foreground pointer-events-none">
            <div className="font-semibold">{hoveredPoint.date}</div>
            <div className="text-[11px] text-primary font-mono">
              Score: {formatScore(hoveredPoint.risk_score)}
            </div>
          </div>
        )}
      </div>

      {/* Date Axis Legend */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-2 font-mono">
        <span>{chartData[0]?.date || "Start"}</span>
        <span>{chartData[Math.floor(chartData.length / 2)]?.date || "Mid"}</span>
        <span>{chartData[chartData.length - 1]?.date || "Latest"}</span>
      </div>
    </div>
  );
}
