"use client";

import React, { useState } from "react";
import { CaseItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Eye, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { CASE_STATUSES } from "../constants";

interface CasesTableProps {
  cases: CaseItem[];
  isLoading?: boolean;
}

export function CasesTable({ cases, isLoading }: CasesTableProps) {
  const [status, setStatus] = useState("ALL");

  const filtered = cases.filter((c) => status === "ALL" || c.status === status);

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            Consolidated Security Cases
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Multi-incident security cases grouping correlated attack campaigns, advanced persistent threats, and evidence.
          </CardDescription>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
        >
          {CASE_STATUSES.map((st) => (
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
                <TableHead className="text-slate-400">Case ID & Title</TableHead>
                <TableHead className="text-slate-400">Severity</TableHead>
                <TableHead className="text-slate-400">Lead Investigator</TableHead>
                <TableHead className="text-slate-400">Incidents Linked</TableHead>
                <TableHead className="text-slate-400">Financial Loss Exposure</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Loading cases...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No active security cases.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                    <TableCell>
                      <span className="font-mono text-indigo-400 font-bold">{item.case_number}</span>
                      <p className="font-semibold text-slate-100 mt-0.5">{item.title}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.severity === "CRITICAL"
                            ? "border-red-800 bg-red-950/50 text-red-400"
                            : "border-amber-800 bg-amber-950/50 text-amber-400"
                        }`}
                      >
                        {item.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-300">{item.lead_investigator}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-slate-300">{item.incident_ids.length} Incidents</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-red-400 font-bold">
                        ${(item.total_financial_exposure / 1000000).toFixed(1)}M
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          item.status === "CLOSED"
                            ? "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                            : "border-indigo-800 bg-indigo-950/50 text-indigo-300"
                        }`}
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/soc/cases/${item.id}`}>
                        <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Workspace
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
