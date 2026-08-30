"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";

interface SOCTimelineViewProps {
  timeline?: Array<{
    timestamp: string;
    actor: string;
    action: string;
    source: string;
    description: string;
  }>;
  isLoading?: boolean;
}

export function SOCTimelineView({ timeline = [], isLoading }: SOCTimelineViewProps) {
  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Real-Time SOC Operational Timeline
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Chronological audit trail of detections, triage decisions, automated playbook steps, and manual actions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading timeline telemetry...</div>
        ) : timeline.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No operational activity recorded.</div>
        ) : (
          <div className="relative border-l border-slate-800 ml-3 space-y-4 py-1">
            {timeline.map((evt, idx) => (
              <div key={idx} className="relative pl-6">
                <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-indigo-300">{evt.action}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{evt.description}</p>
                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-900 text-[11px]">
                    <span className="text-slate-400 font-medium">Actor: {evt.actor}</span>
                    <span className="text-slate-600">·</span>
                    <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-400 text-[10px]">
                      {evt.source}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
