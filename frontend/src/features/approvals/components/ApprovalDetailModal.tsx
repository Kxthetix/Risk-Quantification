"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, ShieldAlert, DollarSign, Server, Layers, AlertTriangle } from "lucide-react";
import { useApprovalDetail } from "../hooks";

interface ApprovalDetailModalProps {
  approvalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApprovalDetailModal({ approvalId, open, onOpenChange }: ApprovalDetailModalProps) {
  const { data: approval, isLoading } = useApprovalDetail(approvalId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl max-h-[85vh] overflow-y-auto">
        {isLoading || !approval ? (
          <div className="py-12 text-center text-slate-500">Loading Approval Context...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                  {approval.action_type}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    approval.status === "PENDING"
                      ? "border-amber-800 bg-amber-950/50 text-amber-400"
                      : "border-emerald-800 bg-emerald-950/50 text-emerald-400"
                  }`}
                >
                  {approval.status}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-100 mt-2">
                Authorization Context: {approval.target}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Triggered by {approval.playbook_name || "SOAR Playbook"} for incident {approval.incident_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-red-950/30 border border-red-900/60 rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-300">Anticipated Business Downtime & Impact</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{approval.potential_impact}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Current Risk Exposure</span>
                  <p className="text-base font-bold font-mono text-red-400 mt-1">
                    ${(approval.current_risk_exposure / 1000000).toFixed(2)}M USD
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Projected Post-Action Risk</span>
                  <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                    ${(approval.projected_risk_exposure / 1000000).toFixed(2)}M USD
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                <span className="font-semibold text-slate-300">Justification Provided by Requester</span>
                <p className="text-slate-300 leading-relaxed">{approval.reason}</p>
                <span className="text-[11px] text-indigo-400 block pt-1">Requested by: {approval.requested_by}</span>
              </div>

              {approval.affected_services.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-300">Dependent Business Services</span>
                  <div className="flex flex-wrap gap-1.5">
                    {approval.affected_services.map((srv) => (
                      <Badge key={srv} variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                        {srv}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
