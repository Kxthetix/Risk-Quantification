"use client";

import React from "react";
import { SOCMetrics } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, ShieldCheck, Zap, Activity, CheckCircle2, TrendingUp } from "lucide-react";

interface SOCMetricsDashboardProps {
  metrics?: SOCMetrics;
  isLoading?: boolean;
}

export function SOCMetricsDashboard({ metrics, isLoading }: SOCMetricsDashboardProps) {
  if (isLoading || !metrics) {
    return <Card className="h-64 bg-slate-900/50 border-slate-800 animate-pulse" />;
  }

  const mttxCards = [
    { title: "Mean Time to Detect (MTTD)", value: `${metrics.mttd_minutes.toFixed(1)} min`, sub: "Automated ingestion & correlation" },
    { title: "Mean Time to Acknowledge (MTTA)", value: `${metrics.mtta_minutes.toFixed(1)} min`, sub: "Analyst initial triage" },
    { title: "Mean Time to Contain (MTTC)", value: `${metrics.mttc_minutes.toFixed(1)} min`, sub: "SOAR isolation enforcement" },
    { title: "Mean Time to Resolve (MTTR)", value: `${metrics.mttr_minutes.toFixed(1)} min`, sub: "Eradication & verification" },
  ];

  const effectivenessCards = [
    { title: "Playbook Success Rate", value: `${metrics.playbook_success_rate_pct}%`, color: "text-emerald-400" },
    { title: "SOAR Automation Rate", value: `${metrics.automation_rate_pct}%`, color: "text-indigo-400" },
    { title: "SLA Compliance Rate", value: `${metrics.sla_compliance_pct}%`, color: "text-emerald-400" },
    { title: "False Positive Rate", value: `${metrics.false_positive_rate_pct}%`, color: "text-slate-300" },
  ];

  return (
    <div className="space-y-6">
      {/* MTTx Operational Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mttxCards.map((c) => (
          <Card key={c.title} className="bg-slate-900/60 border-slate-800 shadow-md backdrop-blur-sm">
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
              <p className="text-2xl font-bold font-mono text-indigo-400 mt-1">{c.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Response Effectiveness & Automation Rates */}
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Response Effectiveness & Automation Performance
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            30-day aggregated performance of automated containment playbooks versus manual analyst interventions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {effectivenessCards.map((item) => (
              <div key={item.title} className="p-4 bg-slate-950/70 rounded-lg border border-slate-800 text-center">
                <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
                <span className="text-xs text-slate-400 mt-1 block">{item.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Automatically Contained:</span>
              <span className="text-emerald-400 font-bold font-mono">{metrics.auto_contained_count} Incidents</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Manually Contained:</span>
              <span className="text-slate-200 font-bold font-mono">{metrics.manually_contained_count} Incidents</span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Failed Actions:</span>
              <span className="text-emerald-400 font-bold font-mono">{metrics.failed_actions_count} Failures</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
