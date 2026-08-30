"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useResolveAlert } from "../hooks";

interface AlertResolveModalProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertResolveModal({ alertId, open, onOpenChange }: AlertResolveModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [rootCause, setRootCause] = useState("");
  const resolveMutation = useResolveAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes) return;

    await resolveMutation.mutateAsync({
      alertId,
      payload: {
        resolution_notes: resolutionNotes,
        root_cause: rootCause || undefined,
      },
    });

    onOpenChange(false);
    setResolutionNotes("");
    setRootCause("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Resolve Alert</DialogTitle>
          <DialogDescription className="text-slate-400">
            Document resolution steps and root cause analysis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Resolution Notes *</Label>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. WAF blocked malicious IP and verified that target backend server was untouched."
              rows={3}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Root Cause Category</Label>
            <Input
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. External Ingress Automated Probe"
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
            <Button type="submit" disabled={resolveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {resolveMutation.isPending ? "Resolving..." : "Mark Resolved"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
