"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Terminal, Sparkles, CheckCircle2 } from "lucide-react";
import { useDetectionRuleDetail } from "../hooks";

interface DetectionRuleDetailModalProps {
  ruleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetectionRuleDetailModal({ ruleId, open, onOpenChange }: DetectionRuleDetailModalProps) {
  const { data: rule, isLoading } = useDetectionRuleDetail(ruleId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !rule ? (
          <div className="py-12 text-center text-slate-500">Loading Rule Logic...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-700 bg-indigo-950/50 text-indigo-300 text-xs">
                  {rule.source}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    rule.severity === "CRITICAL"
                      ? "bg-red-950/50 text-red-400 border-red-800"
                      : "bg-amber-950/50 text-amber-400 border-amber-800"
                  }`}
                >
                  {rule.severity} Severity
                </Badge>
                <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 text-xs">
                  {rule.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100 mt-2">{rule.name}</DialogTitle>
              <DialogDescription className="text-slate-400">{rule.description}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="logic" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="logic" className="text-xs">
                  Detection Logic
                </TabsTrigger>
                <TabsTrigger value="mitre" className="text-xs">
                  MITRE Mapping & Data Sources
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs">
                  Triggered History ({rule.triggered_alerts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="logic" className="space-y-4 pt-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2 font-semibold">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    Signature & Query Definition
                  </span>
                  <pre className="p-3 bg-slate-900/90 rounded font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
                    {rule.detection_logic}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-slate-400">Lifetime Matches:</span>
                    <span className="text-slate-200 font-bold ml-2">{rule.matches_count}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-slate-400">False Positive Rate:</span>
                    <span className="text-emerald-400 font-bold ml-2">{rule.false_positive_rate_pct}%</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mitre" className="space-y-4 pt-3">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400">MITRE ATT&CK Alignment</span>
                  <p className="text-sm font-semibold text-slate-200">{rule.mitre_technique}</p>
                  <Badge variant="outline" className="border-indigo-800 bg-indigo-950/40 text-indigo-300 text-xs">
                    Tactic: {rule.mitre_tactic}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Required Telemetry Sources</span>
                  <div className="flex flex-wrap gap-1.5">
                    {rule.data_sources.map((src) => (
                      <Badge key={src} variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                        {src}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-2 pt-3">
                {rule.triggered_alerts.map((alt) => (
                  <div
                    key={alt.alert_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-semibold">{alt.title}</span>
                    <span className="text-slate-400 font-mono">{new Date(alt.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
