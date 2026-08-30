"use client";

import React, { useState } from "react";
import { CaseDetail } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, ShieldAlert, DollarSign, Layers, Plus, CheckCircle2 } from "lucide-react";
import { useUpdateCase } from "../hooks";

interface CaseDetailWorkspaceProps {
  caseItem: CaseDetail;
}

export function CaseDetailWorkspace({ caseItem }: CaseDetailWorkspaceProps) {
  const updateMutation = useUpdateCase();

  const handleCloseCase = async () => {
    await updateMutation.mutateAsync({
      caseId: caseItem.id,
      payload: { status: "CLOSED" },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Case Status</span>
          <p className="text-lg font-bold text-indigo-400 mt-1">{caseItem.status.replace("_", " ")}</p>
          <span className="text-[11px] text-slate-500">Lead: {caseItem.lead_investigator}</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Total Financial Exposure</span>
          <p className="text-lg font-bold font-mono text-red-400 mt-1">
            ${(caseItem.total_financial_exposure / 1000000).toFixed(2)}M
          </p>
          <span className="text-[11px] text-slate-500">Across linked incidents</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Incidents Linked</span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-1">{caseItem.incident_ids.length} Incidents</p>
          <span className="text-[11px] text-slate-500">Correlated threat stream</span>
        </Card>
        <Card className="bg-slate-900/60 border-slate-800 p-4">
          <span className="text-xs text-slate-400">Actions & Playbooks</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {caseItem.playbook_executions.length} Executed
          </p>
          <span className="text-[11px] text-slate-500">Remediation pipelines</span>
        </Card>
      </div>

      {/* Case Investigation Narrative & Hypothesis */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              Unified Investigation Workspace
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Coordinated cross-incident evidence analysis, campaign tracking, and containment closure.
            </CardDescription>
          </div>

          {caseItem.status !== "CLOSED" && (
            <Button
              size="sm"
              onClick={handleCloseCase}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Close & Validate Case
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300">Case Description</span>
            <p className="text-slate-200 leading-relaxed">{caseItem.description}</p>
          </div>

          {caseItem.hypothesis && (
            <div className="p-4 bg-indigo-950/30 border border-indigo-900/60 rounded-lg space-y-2">
              <span className="font-bold text-indigo-300">Lead Investigator Working Hypothesis</span>
              <p className="text-slate-200 leading-relaxed">{caseItem.hypothesis}</p>
            </div>
          )}

          <div className="space-y-2">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Linked Security Incidents</span>
            <div className="flex flex-wrap gap-2">
              {caseItem.incident_ids.map((incId) => (
                <Badge key={incId} variant="outline" className="border-indigo-800 bg-indigo-950/50 text-indigo-300 text-xs py-1 px-2.5">
                  {incId}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
