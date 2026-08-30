"use client";

import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

export interface DataFreshnessBadgeProps {
  dataAsOf?: string | Date;
  lastUpdated?: string | Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function DataFreshnessBadge({
  dataAsOf,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  className,
}: DataFreshnessBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border/60 bg-card/60 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="flex items-center gap-1.5 flex-wrap">
        {dataAsOf && (
          <span>
            Data as of <strong className="text-foreground font-medium">{formatDateTime(dataAsOf)}</strong>
          </span>
        )}
        {dataAsOf && lastUpdated && <span className="opacity-40">•</span>}
        {lastUpdated && <span>Updated {formatRelativeTime(lastUpdated)}</span>}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-1 rounded p-0.5 hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh data"
          aria-label="Refresh data"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-primary")} />
        </button>
      )}
    </div>
  );
}
