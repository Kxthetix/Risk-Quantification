"use client";

import React, { useState } from "react";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date";
import { DataFreshnessBadge } from "@/components/feedback/DataFreshnessBadge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { GenerateReportModal } from "./GenerateReportModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Calendar,
  Layers,
  Filter,
} from "lucide-react";

export interface DashboardHeaderProps {
  dataAsOf?: string;
  isRefreshing?: boolean;
  onRefresh: () => void;
  period: "7d" | "30d" | "90d" | "1y";
  onPeriodChange: (period: "7d" | "30d" | "90d" | "1y") => void;
  environment: string;
  onEnvironmentChange: (env: string) => void;
}

export function DashboardHeader({
  dataAsOf,
  isRefreshing = false,
  onRefresh,
  period,
  onPeriodChange,
  environment,
  onEnvironmentChange,
}: DashboardHeaderProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 pb-2 border-b border-border/80">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Executive Cyber Risk Overview
            </h1>
            {dataAsOf && (
              <DataFreshnessBadge
                dataAsOf={dataAsOf}
                lastUpdated={dataAsOf}
                className="hidden sm:inline-flex"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Current enterprise cybersecurity posture, probabilistic financial exposure, and prioritized executive mitigation roadmap.
          </p>
        </div>

        {/* Global Dashboard Control Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Updating..." : "Refresh"}</span>
          </Button>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                <Download className="h-3.5 w-3.5" />
                <span>Export View</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => window.print()}
                className="gap-2 text-xs cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-rose-500" />
                <span>Print / Save as PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsReportModalOpen(true)}
                className="gap-2 text-xs cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                <span>Export Structured Data</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Generate Executive Report Button */}
          <Can permission="reports:create">
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 shadow-sm"
              onClick={() => setIsReportModalOpen(true)}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Generate Executive Report</span>
            </Button>
          </Can>
        </div>
      </div>

      {/* Filter & Timestamp Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Timeframe Selector */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(["7d", "30d", "90d", "1y"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPeriodChange(p)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  period === p
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>

          {/* Environment Filter */}
          <select
            value={environment}
            onChange={(e) => onEnvironmentChange(e.target.value)}
            className="flex h-7 rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Filter by environment"
          >
            <option value="ALL" className="bg-popover text-popover-foreground">
              All Environments
            </option>
            <option value="PRODUCTION" className="bg-popover text-popover-foreground">
              Production
            </option>
            <option value="STAGING" className="bg-popover text-popover-foreground">
              Staging
            </option>
            <option value="DEVELOPMENT" className="bg-popover text-popover-foreground">
              Development
            </option>
          </select>
        </div>

        {/* Data As Of Label */}
        {dataAsOf && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Data as of:</span>
            <strong className="text-foreground font-mono">{formatDateTime(dataAsOf)}</strong>
          </div>
        )}
      </div>

      <GenerateReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        period={period}
      />
    </div>
  );
}
