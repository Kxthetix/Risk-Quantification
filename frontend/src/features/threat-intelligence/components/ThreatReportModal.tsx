"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck, DollarSign } from "lucide-react";
import { useThreatReport } from "../hooks";

interface ThreatReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreatReportModal({ open, onOpenChange }: ThreatReportModalProps) {
  const { data: report, isLoading } = useThreatReport();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
        {isLoading || !report ? (
          <div className="py-16 text-center text-slate-500">Compiling Threat Intelligence Landscape Report...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-indigo-700 bg-indigo-950/50 text-indigo-300 text-xs">
                  Executive Briefing
                </Badge>
                <span className="text-xs text-slate-400 font-mono">Generated: {new Date(report.generated_at).toLocaleString()}</span>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Strategic Threat Landscape & Exposure Report
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Authoritative synthesis of active threat campaigns, high-priority adversary cartels, and financial exposure.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              {/* Executive Summary */}
              <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Executive Summary</span>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{report.executive_summary}</p>
              </div>

              {/* Financial Exposure Banner */}
              <div className="p-4 bg-gradient-to-r from-purple-950/40 via-red-950/30 to-slate-950 border border-purple-900/50 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-300 font-medium">Aggregated Threat Exposure Across Active Campaigns</span>
                  <p className="text-2xl font-extrabold text-purple-400 mt-0.5">
                    ${(report.total_financial_exposure / 1000000).toFixed(1)}M USD
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-500/40" />
              </div>

              {/* Top Actors & Threats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Top Observed Adversaries</span>
                  {report.top_threat_actors.map((actor, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">{actor.name}</span>
                      <Badge className="bg-purple-950/60 text-purple-300 border-purple-800 text-[10px]">
                        Risk: {actor.risk_score}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Critical Threat Indicators</span>
                  {report.critical_threats.map((threat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-200">{threat.threat}</span>
                      <Badge className="bg-red-950/60 text-red-400 border-red-800 text-[10px]">
                        {threat.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Defensive Actions */}
              <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Recommended High-ROSI Defensive Mitigations
                </span>
                {report.recommended_defensive_actions.map((act, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="text-slate-200">{act.action}</span>
                    <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800 font-mono">
                      ROSI: +{act.rosi}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
