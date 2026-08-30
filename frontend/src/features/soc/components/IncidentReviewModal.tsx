"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useCreateIncidentReview } from "../hooks";
import { ROOT_CAUSE_CATEGORIES } from "../constants";

interface IncidentReviewModalProps {
  incidentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentReviewModal({ incidentId, open, onOpenChange }: IncidentReviewModalProps) {
  const [category, setCategory] = useState("Vulnerability");
  const [description, setDescription] = useState("");
  const [lessons, setLessons] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");

  const reviewMutation = useCreateIncidentReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !lessons) return;

    await reviewMutation.mutateAsync({
      incidentId,
      payload: {
        root_cause_category: category,
        root_cause_description: description,
        contributing_factors: ["Delayed Emergency Patch", "Perimeter Direct Ingress"],
        affected_controls: ["NIST PR.IP-1"],
        lessons_learned: lessons,
        corrective_actions: correctiveActions ? [correctiveActions] : ["Microsegmentation deployment"],
      },
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Post-Incident Review & Root Cause Analysis</DialogTitle>
          <DialogDescription className="text-slate-400">
            Document comprehensive failure analysis, control gaps, and permanent corrective actions for {incidentId}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Root Cause Category *</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none"
            >
              {ROOT_CAUSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Root Cause Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain how initial vulnerability or misconfiguration was exploited..."
              rows={3}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Lessons Learned *</Label>
            <Textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What could be improved in detection latency or automated containment?"
              rows={2}
              required
              className="bg-slate-950 border-slate-700 text-slate-100 text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Permanent Corrective Action</Label>
            <Input
              value={correctiveActions}
              onChange={(e) => setCorrectiveActions(e.target.value)}
              placeholder="e.g. Decommission legacy ingress port and enforce zero-trust egress"
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
            <Button type="submit" disabled={reviewMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {reviewMutation.isPending ? "Submitting..." : "Save Post-Incident Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
