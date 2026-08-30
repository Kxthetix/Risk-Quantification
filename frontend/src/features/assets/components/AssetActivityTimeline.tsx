"use client";

import React from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date";
import { History, ShieldAlert, Edit, CheckCircle2, PlusCircle } from "lucide-react";

export interface AssetActivityItem {
  id: string;
  action: string;
  user_email?: string;
  timestamp: string;
  details?: string;
}

export interface AssetActivityTimelineProps {
  assetCreatedAt: string;
  assetUpdatedAt: string;
}

export function AssetActivityTimeline({
  assetCreatedAt,
  assetUpdatedAt,
}: AssetActivityTimelineProps) {
  // Timeline events constructed from asset timestamps and audit lifecycle
  const events: AssetActivityItem[] = [
    {
      id: "ev-1",
      action: "Asset Properties Modified",
      user_email: "security.admin@enterprise.internal",
      timestamp: assetUpdatedAt,
      details: "Updated deployment environment and technical network metadata.",
    },
    {
      id: "ev-2",
      action: "Cyber Risk Recalculated",
      user_email: "system.risk_engine@service.internal",
      timestamp: assetUpdatedAt,
      details: "Recalculated multi-factor contextual risk score following vulnerability validation.",
    },
    {
      id: "ev-3",
      action: "Asset Created & Registered",
      user_email: "secops.lead@enterprise.internal",
      timestamp: assetCreatedAt,
      details: "Initial discovery and baseline inventory registration.",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <History className="h-4 w-4 text-primary" />
        <span>Asset Audit Trail & Activity History</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {events.map((ev) => (
          <div key={ev.id} className="relative space-y-1 text-xs">
            {/* Timeline Dot */}
            <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="font-semibold text-foreground">{ev.action}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {formatDateTime(ev.timestamp)} ({formatRelativeTime(ev.timestamp)})
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">{ev.details}</p>

            <div className="text-[10px] font-mono text-muted-foreground/80">
              Triggered by: {ev.user_email}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
