"use client";

import React, { useState } from "react";
import { ResponseExecution } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Eye, RotateCcw, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { EXECUTION_STATUSES } from "../constants";

interface ExecutionsTableProps {
  executions: ResponseExecution[];
  isLoading?: boolean;
}

export function ExecutionsTable({ executions, isLoading }: ExecutionsTableProps) {
  const [status, setStatus] = useState("ALL");

  const filtered = executions.filter((e) => status === "ALL" || e.status === status);

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400" />
            Active SOAR Response Executions
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real-time execution status of automated incident response playbooks and remediation pipelines.
          </CardDescription>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
        >
          {EXECUTION_STATUSES.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Execution ID & Playbook</TableHead>
                <TableHead className="text-slate-400">Incident Target</TableHead>
                <TableHead className="text-slate-400">Progress</TableHead>
                <TableHead className="text-slate-400">Financial Loss Reduced</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading executions...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No active or recent response executions.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.execution_id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{item.playbook_name}</span>
                        {item.dry_run && (
                          <Badge variant="outline" className="border-amber-800 bg-amber-950/50 text-amber-400 text-[10px]">
                            DRY RUN
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 text-[11px] block mt-0.5">{item.execution_id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-indigo-400 font-semibold">{item.incident_id || "Direct Target"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{
                              width: `${(item.steps_executed / Math.max(item.total_steps, 1)) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px]">
                          {item.steps_executed}/{item.total_steps}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-emerald-400 font-bold">
                        +${(item.financial_exposure_reduced / 1000000).toFixed(1)}M
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.status === "SUCCEEDED"
                            ? "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                            : item.status === "RUNNING"
                            ? "border-blue-800 bg-blue-950/50 text-blue-400"
                            : item.status === "WAITING_FOR_APPROVAL"
                            ? "border-amber-800 bg-amber-950/50 text-amber-400"
                            : "border-red-800 bg-red-950/50 text-red-400"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/soc/executions/${item.execution_id}`}>
                        <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Steps
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
