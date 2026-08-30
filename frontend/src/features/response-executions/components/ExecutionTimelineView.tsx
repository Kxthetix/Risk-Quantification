"use client";

import React, { useState } from "react";
import { ResponseExecution } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, ShieldAlert, Clock, AlertTriangle, Undo2 } from "lucide-react";
import { useRetryExecutionStep, useRollbackExecution } from "../hooks";

interface ExecutionTimelineViewProps {
  execution: ResponseExecution;
}

export function ExecutionTimelineView({ execution }: ExecutionTimelineViewProps) {
  const retryMutation = useRetryExecutionStep();
  const rollbackMutation = useRollbackExecution();
  const [rollbackConfirm, setRollbackConfirm] = useState(false);

  const handleRetry = async (stepId: string) => {
    await retryMutation.mutateAsync({
      executionId: execution.execution_id,
      payload: { step_id: stepId, force_override: true },
    });
  };

  const handleRollback = async () => {
    await rollbackMutation.mutateAsync({
      executionId: execution.execution_id,
      payload: {
        reason: "Manual operator trigger from SOAR execution console",
        authorized_by: "SOC Analyst Lead",
      },
    });
    setRollbackConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Execution Summary Topbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Execution Status</span>
          <p className="text-lg font-bold text-indigo-400 mt-1">{execution.status.replace("_", " ")}</p>
          <span className="text-[11px] text-slate-500">
            {execution.steps_executed} / {execution.total_steps} steps completed
          </span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Initial Risk Score</span>
          <p className="text-lg font-bold font-mono text-red-400 mt-1">{execution.risk_before_score.toFixed(1)} / 100</p>
          <span className="text-[11px] text-slate-500">Prior to playbook execution</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Residual Risk Score</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {execution.risk_after_score !== undefined ? `${execution.risk_after_score.toFixed(1)} / 100` : "Calculating..."}
          </p>
          <span className="text-[11px] text-slate-500">Post-containment state</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Mitigated Financial Risk</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            +${(execution.financial_exposure_reduced / 1000000).toFixed(2)}M
          </p>
          <span className="text-[11px] text-slate-500">Direct exposure reduction</span>
        </Card>
      </div>

      {/* Step Trace Timeline */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Execution Trace & Step Telemetry
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Audit record of each playbook step, execution duration, and infrastructure responses.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setRollbackConfirm(true)}
            disabled={rollbackMutation.isPending || execution.status === "CANCELLED"}
            className="border-red-900 bg-red-950/40 text-red-300 hover:bg-red-900/60 text-xs h-8"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1" />
            Rollback Execution
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {execution.steps.map((step) => (
              <div
                key={step.step_id}
                className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    {step.status === "SUCCEEDED" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : step.status === "FAILED" ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{step.name}</span>
                      <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-400 text-[10px]">
                        {step.action_type}
                      </Badge>
                      {step.is_high_risk && (
                        <Badge variant="outline" className="border-red-800 bg-red-950 text-red-400 text-[10px]">
                          HIGH RISK
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-300 text-xs mt-1">{step.result || step.error_message || "Awaiting trigger..."}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  {step.duration_ms && (
                    <span className="font-mono text-slate-500 text-[11px]">{step.duration_ms}ms</span>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      step.status === "SUCCEEDED"
                        ? "border-emerald-800 bg-emerald-950 text-emerald-400"
                        : step.status === "FAILED"
                        ? "border-red-800 bg-red-950 text-red-400"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    {step.status}
                  </Badge>
                  {step.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetry(step.step_id)}
                      disabled={retryMutation.isPending}
                      className="text-xs text-amber-400 hover:text-amber-300 h-7 px-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Retry Step
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {rollbackConfirm && (
        <Card className="p-4 bg-red-950/40 border-red-800 text-xs space-y-3">
          <div className="flex items-center gap-2 text-red-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Confirm Response Rollback
          </div>
          <p className="text-slate-300">
            This will trigger compensating rollback actions across infrastructure (e.g. un-isolating assets, removing edge firewall rules).
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setRollbackConfirm(false)} className="text-xs border-slate-700">
              Cancel
            </Button>
            <Button size="sm" onClick={handleRollback} className="bg-red-600 hover:bg-red-500 text-white text-xs">
              Confirm Rollback
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
