"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMarkAlertFalsePositive } from "../hooks";

interface AlertFalsePositiveModalProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertFalsePositiveModal({ alertId, open, onOpenChange }: AlertFalsePositiveModalProps) {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const fpMutation = useMarkAlertFalsePositive();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    await fpMutation.mutateAsync({
      alertId,
      payload: {
        reason,
        comment: comment || undefined,
      },
    });

    onOpenChange(false);
    setReason("");
    setComment("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Mark as False Positive</DialogTitle>
          <DialogDescription className="text-slate-400">
            Provide justification for tuning detection rules and training suppression filters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Justification / Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Authorized internal vulnerability scanner IP executed benign port sweep."
              rows={3}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Rule Tuning Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Suggest exclusion whitelist for subnet 10.0.1.0/24."
              rows={2}
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
            <Button type="submit" disabled={fpMutation.isPending} className="bg-slate-800 hover:bg-slate-700 text-slate-200">
              {fpMutation.isPending ? "Updating..." : "Mark False Positive"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
