"use client";

import React from "react";
import { formatScore } from "@/lib/utils/number";
import { RiskBadge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, TrendingDown, TrendingUp, HelpCircle } from "lucide-react";

export interface RiskScoreCardProps {
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  previousScore?: number;
  change?: number;
  trend?: "UP" | "DOWN" | "STABLE" | "IMPROVING" | "WORSENING";
  assessedCount?: number;
}

export function RiskScoreCard({
  score,
  level,
  previousScore = 74.6,
  change = 3.8,
  trend = "UP",
  assessedCount = 1248,
}: RiskScoreCardProps) {
  // SVG Radial Gauge Calculation (0 to 100)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  const getGaugeColor = (lvl: string) => {
    switch (lvl) {
      case "LOW":
        return "#10b981"; // emerald-500
      case "MEDIUM":
        return "#f59e0b"; // amber-500
      case "HIGH":
        return "#f97316"; // orange-500
      case "CRITICAL":
      default:
        return "#ef4444"; // rose-500
    }
  };

  const gaugeColor = getGaugeColor(level);
  const isImproving = trend === "DOWN" || trend === "IMPROVING";

  return (
    <div className="flex flex-col items-center justify-between h-full p-2 text-center space-y-4">
      {/* Radial Gauge */}
      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-muted/30"
          />
          {/* Active Meter */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={gaugeColor}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score & Badge */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-foreground tracking-tight">
            {formatScore(score)}
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            out of 100
          </span>
        </div>
      </div>

      {/* Tier & Trend Indicator */}
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-center gap-2">
          <RiskBadge level={level} className="text-xs px-2.5 py-0.5" />
          <div
            className={`flex items-center text-xs font-semibold ${
              isImproving ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isImproving ? <TrendingDown className="h-3.5 w-3.5 mr-0.5" /> : <TrendingUp className="h-3.5 w-3.5 mr-0.5" />}
            <span>
              {isImproving ? "-" : "+"}
              {Math.abs(change)}% vs prior
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Overall risk aggregated across {assessedCount} infrastructure endpoints, business workflows, and threat intel feeds.
        </p>
      </div>

      {/* Tier Classification Scale Footer */}
      <div className="w-full grid grid-cols-4 gap-1 text-[10px] pt-2 border-t border-border/50 text-muted-foreground">
        <div className="flex flex-col items-center">
          <span className="font-semibold text-emerald-500">0-25</span>
          <span>Low</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-amber-500">26-50</span>
          <span>Medium</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-orange-500">51-75</span>
          <span>High</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-semibold text-rose-500">76-100</span>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}
