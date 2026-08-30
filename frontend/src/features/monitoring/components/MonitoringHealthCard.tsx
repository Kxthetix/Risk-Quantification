"use client";

import React from "react";
import { MonitoringHealth } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Cpu, HardDrive, Zap } from "lucide-react";

interface MonitoringHealthCardProps {
  health?: MonitoringHealth;
  isLoading?: boolean;
}

export function MonitoringHealthCard({ health, isLoading }: MonitoringHealthCardProps) {
  if (isLoading || !health) {
    return <Card className="h-44 bg-slate-900/50 border-slate-800 animate-pulse" />;
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          SOC Detection Engine & Pipeline Health
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Telemetry ingestion pipeline state, detection evaluation latency, and buffer memory load.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Connected Sources</span>
            <p className="text-lg font-bold text-slate-100 mt-1">{health.connected_sources_count} Pipelines</p>
            <span className="text-[11px] text-emerald-400">0 Disconnected</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Event Ingestion Status</span>
            <p className="text-sm font-semibold text-emerald-400 mt-1">{health.event_processing_status}</p>
            <span className="text-[11px] text-slate-400">0 Dropped records</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Detection Latency</span>
            <p className="text-lg font-mono font-bold text-indigo-400 mt-1">{health.avg_processing_latency_ms} ms</p>
            <span className="text-[11px] text-slate-400">Real-time evaluated</span>
          </div>

          <div className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400">Buffer Memory Usage</span>
            <p className="text-lg font-mono font-bold text-slate-200 mt-1">{health.buffer_memory_usage_pct}%</p>
            <span className="text-[11px] text-slate-400">Stable queue capacity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
