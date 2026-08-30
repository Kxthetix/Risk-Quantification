"use client";

import React, { useState } from "react";
import { ApprovalItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckSquare, ShieldAlert, Eye, CheckCircle2, XCircle } from "lucide-react";
import { APPROVAL_STATUSES } from "../constants";
import { ApprovalDetailModal } from "./ApprovalDetailModal";
import { HighRiskConfirmDialog } from "./HighRiskConfirmDialog";

interface ApprovalsTableProps {
  approvals: ApprovalItem[];
  isLoading?: boolean;
}

export function ApprovalsTable({ approvals, isLoading }: ApprovalsTableProps) {
  const [status, setStatus] = useState("ALL");
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);

  const filtered = approvals.filter((a) => status === "ALL" || a.status === status);

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              High-Risk Action Approval Queue
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Mandatory SOC Manager authorization required for destructive network isolation, session revokes, and firewall deployments.
            </CardDescription>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
          >
            {APPROVAL_STATUSES.map((st) => (
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
                  <TableHead className="text-slate-400">Action & Incident</TableHead>
                  <TableHead className="text-slate-400">Target Resource</TableHead>
                  <TableHead className="text-slate-400">Requested By</TableHead>
                  <TableHead className="text-slate-400">Risk Exposure (Before ➔ After)</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading approval queue...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No pending response approvals.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{item.action_type}</span>
                          {item.is_high_risk && (
                            <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-[10px]">
                              HIGH RISK
                            </Badge>
                          )}
                        </div>
                        <p className="text-indigo-400 font-mono text-[11px] mt-0.5">{item.incident_number || item.incident_id}</p>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-200">{item.target}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{item.requested_by}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-red-400 font-bold">${(item.current_risk_exposure / 1000000).toFixed(1)}M</span>
                        <span className="text-slate-500 mx-1">➔</span>
                        <span className="font-mono text-emerald-400 font-bold">${(item.projected_risk_exposure / 1000000).toFixed(1)}M</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            item.status === "PENDING"
                              ? "border-amber-800 bg-amber-950/50 text-amber-400"
                              : item.status === "APPROVED"
                              ? "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                              : "border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {item.status === "PENDING" && (
                          <Button
                            size="sm"
                            onClick={() => setConfirmApproveId(item.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Authorize
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveApprovalId(item.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {activeApprovalId && (
        <ApprovalDetailModal
          approvalId={activeApprovalId}
          open={Boolean(activeApprovalId)}
          onOpenChange={(open) => !open && setActiveApprovalId(null)}
        />
      )}

      {confirmApproveId && (
        <HighRiskConfirmDialog
          approvalId={confirmApproveId}
          open={Boolean(confirmApproveId)}
          onOpenChange={(open) => !open && setConfirmApproveId(null)}
        />
      )}
    </>
  );
}
