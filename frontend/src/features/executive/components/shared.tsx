"use client";

import { cn } from "@/lib/utils/cn";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { RiskLevel, TrendDirection } from "../types";
import { RISK_LEVEL_BG } from "../constants";

interface RiskLevelBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskLevelBadge({ level, className }: RiskLevelBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        RISK_LEVEL_BG[level],
        className
      )}
    >
      {level}
    </span>
  );
}

interface TrendIndicatorProps {
  direction?: TrendDirection;
  change?: number;
  suffix?: string;
  className?: string;
  invertColors?: boolean; // true = down is good (e.g. risk reduction)
}

export function TrendIndicator({
  direction,
  change,
  suffix = "",
  className,
  invertColors = false,
}: TrendIndicatorProps) {
  const isUp = direction === "up";
  const isDown = direction === "down";

  const goodColor = invertColors ? "text-red-400" : "text-green-400";
  const badColor = invertColors ? "text-green-400" : "text-red-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isUp ? (invertColors ? goodColor : badColor) : "",
        isDown ? (invertColors ? badColor : goodColor) : "",
        !isUp && !isDown ? "text-gray-400" : "",
        className
      )}
    >
      {isUp && <TrendingUp className="h-3.5 w-3.5" />}
      {isDown && <TrendingDown className="h-3.5 w-3.5" />}
      {!isUp && !isDown && <Minus className="h-3.5 w-3.5" />}
      {change !== undefined && (
        <span>
          {change > 0 ? "+" : ""}
          {change.toFixed(1)}
          {suffix}
        </span>
      )}
    </span>
  );
}

interface DataFreshnessBadgeProps {
  lastUpdated?: string;
  className?: string;
}

export function DataFreshnessBadge({ lastUpdated, className }: DataFreshnessBadgeProps) {
  if (!lastUpdated) return null;
  const date = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const label =
    diffMin < 1
      ? "Just now"
      : diffMin < 60
      ? `${diffMin}m ago`
      : `${Math.floor(diffMin / 60)}h ago`;

  return (
    <span className={cn("text-xs text-gray-500", className)}>
      Last updated: {label}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  level?: RiskLevel;
  trend?: TrendDirection;
  change?: number;
  changeSuffix?: string;
  drillDownUrl?: string;
  className?: string;
  invertTrendColors?: boolean;
}

export function MetricCard({
  label,
  value,
  subValue,
  icon,
  level,
  trend,
  change,
  changeSuffix,
  drillDownUrl,
  className,
  invertTrendColors,
}: MetricCardProps) {
  const content = (
    <div
      className={cn(
        "relative rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5",
        "backdrop-blur-sm transition-all duration-200",
        drillDownUrl && "cursor-pointer hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {subValue && <span className="text-sm text-gray-400">{subValue}</span>}
          </div>
          {(trend !== undefined || change !== undefined) && (
            <div className="mt-2">
              <TrendIndicator
                direction={trend}
                change={change}
                suffix={changeSuffix}
                invertColors={invertTrendColors}
              />
            </div>
          )}
          {level && (
            <div className="mt-2">
              <RiskLevelBadge level={level} />
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  if (drillDownUrl) {
    return <a href={drillDownUrl}>{content}</a>;
  }
  return content;
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-white/10 bg-slate-800/50 p-5",
        className
      )}
    >
      <div className="h-3 w-24 rounded bg-slate-700" />
      <div className="mt-3 h-7 w-32 rounded bg-slate-700" />
      <div className="mt-2 h-3 w-16 rounded bg-slate-700" />
    </div>
  );
}
