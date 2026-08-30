"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2, DollarSign, ShieldAlert, Sparkles } from "lucide-react";
import { useExecutePlaybook, usePlaybookDetail } from "../hooks";

interface PlaybookDryRunModalProps {
  playbookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlaybookDryRunModal({ playbookId, open, onOpenChange }: PlaybookDryRunModalProps) {
  const { data: playbook } = usePlaybookDetail(playbookId);
  const executeMutation = useExecutePlaybook();

  const handleDryRun = async () => {
    await executeMutation.mutateAsync({
      playbookId,
      payload: { dry_run: true, target_parameters: {} },
    });
  };

  const result = executeMutation.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Playbook Pre-Flight Simulation & Dry Run
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Simulate playbook execution against current infrastructure without triggering production changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {playbook && (
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-200">{playbook.name}</span>
              <p className="text-slate-400">{playbook.description}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleDryRun}
            disabled={executeMutation.isPending}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1.5 h-9"
          >
            <Play className="w-3.5 h-3.5" />
            {executeMutation.isPending ? "Simulating Execution Pipeline..." : "Execute Dry Run Simulation"}
          </Button>

          {result && (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Dry Run Completed with Zero Errors
                </span>
                <p className="text-[11px] text-slate-300">
                  {result.steps_executed} of {result.total_steps} actions evaluated against sandbox telemetry.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Simulated Step Traces</span>
                {result.steps.map((st) => (
                  <div key={st.step_id} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{st.name}</span>
                      <Badge variant="outline" className="text-[9px] border-slate-700 bg-slate-900 text-slate-400">
                        {st.action_type}
                      </Badge>
                    </div>
                    <p className="text-slate-400 mt-1">{st.result}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
