"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAssignAlert } from "../hooks";

interface AlertAssignModalProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertAssignModal({ alertId, open, onOpenChange }: AlertAssignModalProps) {
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const assignMutation = useAssignAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedTo) return;

    await assignMutation.mutateAsync({
      alertId,
      payload: {
        assigned_to: assignedTo,
        notes: notes || undefined,
      },
    });

    onOpenChange(false);
    setAssignedTo("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Assign Alert</DialogTitle>
          <DialogDescription className="text-slate-400">
            Route this alert to a designated SOC Analyst or Incident Commander.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Assignee (Name or Email) *</Label>
            <Input
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="e.g. SOC Tier 2 Lead"
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Triage Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial triage findings or priority instructions."
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm"
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
            <Button type="submit" disabled={assignMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {assignMutation.isPending ? "Assigning..." : "Assign Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
