"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useTriageIncident } from "../hooks";
import { CheckCircle2, XCircle, ArrowUpRight, UserPlus } from "lucide-react";

interface IncidentTriageModalProps {
  incidentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentTriageModal({ incidentId, open, onOpenChange }: IncidentTriageModalProps) {
  const [decision, setDecision] = useState<"CONFIRMED" | "FALSE_POSITIVE" | "ESCALATED" | "ASSIGNED">("CONFIRMED");
  const [reason, setReason] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [severity, setSeverity] = useState("HIGH");

  const triageMutation = useTriageIncident();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    await triageMutation.mutateAsync({
      incidentId,
      payload: {
        decision,
        reason,
        assigned_to: assignedTo || undefined,
        severity,
      },
    });

    onOpenChange(false);
    setReason("");
    setAssignedTo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Incident Triage Decision</DialogTitle>
          <DialogDescription className="text-slate-400">
            Submit formal analyst triage review for {incidentId}. This action is immutable and logged to the audit ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Triage Decision *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision("CONFIRMED")}
                className={`text-xs justify-start h-10 border-slate-800 ${
                  decision === "CONFIRMED"
                    ? "bg-red-950/60 text-red-300 border-red-700"
                    : "bg-slate-950 text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mr-2 text-red-400" />
                Confirm Threat
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision("FALSE_POSITIVE")}
                className={`text-xs justify-start h-10 border-slate-800 ${
                  decision === "FALSE_POSITIVE"
                    ? "bg-slate-800 text-slate-200 border-slate-600"
                    : "bg-slate-950 text-slate-400"
                }`}
              >
                <XCircle className="w-4 h-4 mr-2 text-slate-400" />
                False Positive
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision("ESCALATED")}
                className={`text-xs justify-start h-10 border-slate-800 ${
                  decision === "ESCALATED"
                    ? "bg-purple-950/60 text-purple-300 border-purple-700"
                    : "bg-slate-950 text-slate-400"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 mr-2 text-purple-400" />
                Escalate Tier 3
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDecision("ASSIGNED")}
                className={`text-xs justify-start h-10 border-slate-800 ${
                  decision === "ASSIGNED"
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-700"
                    : "bg-slate-950 text-slate-400"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2 text-indigo-400" />
                Reassign Team
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Severity Assessment</Label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Assign Responder</Label>
              <Input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Sarah Chen (Lead)"
                className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Triage Justification & Evidence *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State IOC match, beacon frequency, or reason for classification..."
              rows={3}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={triageMutation.isPending} className="bg-red-600 hover:bg-red-500 text-white">
              {triageMutation.isPending ? "Submitting..." : "Submit Triage Decision"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
