"use client";

import React from "react";
import { AssetStatistics } from "@/types/asset";
import { formatNumber } from "@/lib/utils/number";
import { Card, CardContent } from "@/components/ui/card";
import { Server, ShieldAlert, Globe, Database, Network, AlertTriangle } from "lucide-react";

export interface AssetSummaryCardsProps {
  statistics?: AssetStatistics;
  isLoading?: boolean;
}

export function AssetSummaryCards({ statistics, isLoading = false }: AssetSummaryCardsProps) {
  const stats = statistics || {
    total_assets: 0,
    active_assets: 0,
    critical_assets: 0,
    internet_exposed_assets: 0,
    production_assets: 0,
    servers: 0,
    databases: 0,
    network_devices: 0,
    by_type: {},
    by_criticality: {},
    by_environment: {},
    by_status: {},
  };

  const highRiskEstimate = (stats.by_criticality?.["HIGH"] || 0) + (stats.critical_assets || 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. Total Assets */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assets</span>
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatNumber(stats.total_assets)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {formatNumber(stats.active_assets)} active endpoints
          </span>
        </CardContent>
      </Card>

      {/* 2. Critical Tier */}
      <Card className="border-rose-500/30 bg-rose-500/5">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Assets</span>
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-500 tracking-tight">
            {formatNumber(stats.critical_assets)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            High business importance
          </span>
        </CardContent>
      </Card>

      {/* 3. High Risk Assets */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-orange-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Risk</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-orange-500 tracking-tight">
            {formatNumber(highRiskEstimate)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Critical & High severity
          </span>
        </CardContent>
      </Card>

      {/* 4. Internet-Facing */}
      <Card className="border-border bg-card/80">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Internet Exposed</span>
            <Globe className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 tracking-tight">
            {formatNumber(stats.internet_exposed_assets)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Public edge perimeter
          </span>
        </CardContent>
      </Card>

      {/* 5. Production Databases & Servers */}
      <Card className="border-border bg-card/80 col-span-2 sm:col-span-1">
        <CardContent className="p-3.5 flex flex-col justify-between space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Databases & Servers</span>
            <Database className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            {formatNumber((stats.servers || 0) + (stats.databases || 0))}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Core data infrastructure
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
