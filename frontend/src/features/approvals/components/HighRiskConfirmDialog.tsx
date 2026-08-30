"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { useApprovalDetail, useProcessApproval } from "../hooks";

interface HighRiskConfirmDialogProps {
  approvalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HighRiskConfirmDialog({ approvalId, open, onOpenChange }: HighRiskConfirmDialogProps) {
  const { data: approval } = useApprovalDetail(approvalId);
  const [justification, setJustification] = useState("Authorized emergency containment per SOC Incident Commander procedure.");
  const [confirmed, setConfirmed] = useState(false);

  const processMutation = useProcessApproval();

  const handleApprove = async () => {
    if (!confirmed || !justification) return;

    await processMutation.mutateAsync({
      approvalId,
      payload: {
        decision: "APPROVE",
        justification,
        confirmed_destructive_risk: true,
      },
    });

    onOpenChange(false);
  };

  const handleReject = async () => {
    await processMutation.mutateAsync({
      approvalId,
      payload: {
        decision: "REJECT",
        justification: "Rejected by SOC Manager; alternate containment path requested.",
        confirmed_destructive_risk: false,
      },
    });

    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-red-900 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            High-Risk Security Action Confirmation
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            You are about to authorize an invasive security action against production infrastructure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          {approval && (
            <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/80 space-y-1.5">
              <div>
                <span className="text-slate-400">Target:</span>
                <p className="font-bold text-slate-100 mt-0.5">{approval.target}</p>
              </div>
              <div>
                <span className="text-slate-400">Action:</span>
                <p className="font-bold text-red-300 mt-0.5">{approval.action_type}</p>
              </div>
              <div>
                <span className="text-slate-400">Potential Business Impact:</span>
                <p className="text-slate-300 mt-0.5">{approval.potential_impact || "Service interruption may occur."}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Authorization Justification *</Label>
            <Textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={2}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-xs resize-none"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-red-600 focus:ring-red-500"
            />
            <span className="text-xs text-slate-200 font-medium">
              I acknowledge the potential operational downtime and authorize execution.
            </span>
          </label>
        </div>

        <DialogFooter className="pt-2 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReject}
            disabled={processMutation.isPending}
            className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Reject Action
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApprove}
              disabled={!confirmed || processMutation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white text-xs"
            >
              {processMutation.isPending ? "Executing..." : "Confirm & Execute"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
