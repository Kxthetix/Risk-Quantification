"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { ArrowLeft, Clock, RefreshCw, Play, CheckCircle2 } from "lucide-react";
import { AnalysisPanel } from "@/features/attack-paths/components/AnalysisPanel";

export default function AnalysisHistoryPage() {
  const runs = [
    { id: "run-004", started_at: "2026-08-30T09:00:00Z", duration: "18.4s", nodes_evaluated: 1840, paths_discovered: 24, critical_paths: 8, status: "COMPLETED", triggered_by: "Automated Daily Schedule" },
    { id: "run-003", started_at: "2026-08-29T14:22:10Z", duration: "21.1s", nodes_evaluated: 1820, paths_discovered: 23, critical_paths: 7, status: "COMPLETED", triggered_by: "Security Engineer (User)" },
    { id: "run-002", started_at: "2026-08-28T09:00:00Z", duration: "19.5s", nodes_evaluated: 1790, paths_discovered: 21, critical_paths: 6, status: "COMPLETED", triggered_by: "Automated Daily Schedule" },
    { id: "run-001", started_at: "2026-08-27T10:15:30Z", duration: "24.0s", nodes_evaluated: 1750, paths_discovered: 19, critical_paths: 5, status: "COMPLETED", triggered_by: "Initial Onboarding Ingestion" },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/attack-paths">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Attack Path Analysis Runs &amp; Audit History
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit log of periodic and on-demand graph discovery simulations.
          </p>
        </div>

        <AnalysisPanel />
      </div>

      <div className="border border-border rounded-lg bg-card/60 backdrop-blur-sm overflow-x-auto shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs font-semibold">Run ID</TableHead>
              <TableHead className="text-xs font-semibold">Execution Timestamp</TableHead>
              <TableHead className="text-xs font-semibold">Trigger Source</TableHead>
              <TableHead className="text-xs font-semibold text-center">Duration</TableHead>
              <TableHead className="text-xs font-semibold text-center">Nodes Evaluated</TableHead>
              <TableHead className="text-xs font-semibold text-center">Paths Discovered</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((r) => (
              <TableRow key={r.id} className="hover:bg-muted/40 transition-colors border-border">
                <TableCell className="text-xs font-mono font-bold text-primary">
                  {r.id}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {new Date(r.started_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs text-foreground font-medium">
                  {r.triggered_by}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-muted-foreground">
                  {r.duration}
                </TableCell>
                <TableCell className="text-center font-mono text-xs text-foreground">
                  {r.nodes_evaluated}
                </TableCell>
                <TableCell className="text-center font-mono text-xs font-bold text-rose-400">
                  {r.paths_discovered} ({r.critical_paths} crit)
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={r.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
