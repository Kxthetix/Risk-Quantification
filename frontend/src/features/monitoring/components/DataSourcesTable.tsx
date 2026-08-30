"use client";

import React from "react";
import { DataSourceHealth } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Database, Wifi } from "lucide-react";

interface DataSourcesTableProps {
  sources: DataSourceHealth[];
  isLoading?: boolean;
}

export function DataSourcesTable({ sources, isLoading }: DataSourcesTableProps) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-400" />
          Connected Security Telemetry & Log Sources
        </CardTitle>
        <CardDescription className="text-slate-400">
          Real-time ingestion pipelines from SIEM, EDR agents, Web Application Firewalls, and Cloud providers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Source Name</TableHead>
                <TableHead className="text-slate-400">Category</TableHead>
                <TableHead className="text-slate-400">Throughput (EPM)</TableHead>
                <TableHead className="text-slate-400">Bandwidth</TableHead>
                <TableHead className="text-slate-400">Last Received</TableHead>
                <TableHead className="text-slate-400 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading data sources...
                  </TableCell>
                </TableRow>
              ) : sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No data sources connected.
                  </TableCell>
                </TableRow>
              ) : (
                sources.map((src) => (
                  <TableRow key={src.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <TableCell>
                      <span className="font-semibold text-slate-100">{src.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                        {src.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-indigo-300 font-bold">
                        {src.events_per_minute.toLocaleString()} /min
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-400 font-mono">{src.throughput_mb_per_sec.toFixed(1)} MB/s</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-400">{new Date(src.last_event_received).toLocaleTimeString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={`text-xs w-fit ml-auto flex items-center gap-1 ${
                          src.status === "HEALTHY"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                            : "bg-red-950/40 text-red-400 border-red-800"
                        }`}
                        variant="outline"
                      >
                        {src.status === "HEALTHY" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {src.status}
                      </Badge>
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
