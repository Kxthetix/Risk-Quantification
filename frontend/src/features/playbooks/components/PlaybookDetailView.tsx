"use client";

import React from "react";
import { PlaybookDetail } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ShieldCheck, Zap, Layers, AlertTriangle, Key } from "lucide-react";

interface PlaybookDetailViewProps {
  playbook: PlaybookDetail;
}

export function PlaybookDetailView({ playbook }: PlaybookDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Trigger Mode</span>
          <p className="text-lg font-bold text-indigo-400 mt-1">{playbook.trigger_type}</p>
          <span className="text-[11px] text-slate-500">{playbook.status} in production</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Success Rate</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">{playbook.success_rate_pct}%</p>
          <span className="text-[11px] text-slate-500">{playbook.execution_count} Lifetime executions</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Estimated Risk Reduction</span>
          <p className="text-lg font-bold text-pink-400 mt-1">-{playbook.estimated_risk_reduction_pct}%</p>
          <span className="text-[11px] text-slate-500">Upon containment completion</span>
        </Card>
      </div>

      {/* Playbook Step Hierarchy */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Playbook Execution Steps & Workflow Hierarchy
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Sequential enforcement workflow with automated condition gates and mandatory approval checkpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {playbook.steps.map((step) => (
            <div
              key={step.step_id}
              className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-bold font-mono text-[11px]">
                  {step.step_number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{step.name}</span>
                    {step.is_high_risk && (
                      <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-[10px]">
                        HIGH RISK
                      </Badge>
                    )}
                    {step.requires_approval && (
                      <Badge variant="outline" className="border-amber-800 bg-amber-950/50 text-amber-400 text-[10px]">
                        REQUIRES APPROVAL
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 font-mono">Action: {step.action_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Target: {step.default_target || "Context-Derived"}</span>
                <span>·</span>
                <span>Timeout: {step.timeout_seconds}s</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
