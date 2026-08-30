"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Bell, Server, Flame, Activity, ShieldAlert } from "lucide-react";
import { useAlertDetail } from "../hooks";

interface AlertDetailModalProps {
  alertId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertDetailModal({ alertId, open, onOpenChange }: AlertDetailModalProps) {
  const { data: alert, isLoading } = useAlertDetail(alertId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !alert ? (
          <div className="py-12 text-center text-slate-500">Loading Alert Detail...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    alert.severity === "CRITICAL"
                      ? "bg-red-950/50 text-red-400 border-red-800"
                      : "bg-amber-950/50 text-amber-400 border-amber-800"
                  }`}
                >
                  {alert.severity} Severity
                </Badge>
                <Badge variant="outline" className="border-indigo-800 bg-indigo-950/50 text-indigo-300 text-xs">
                  {alert.source}
                </Badge>
                <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                  {alert.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100 mt-2">{alert.title}</DialogTitle>
              <DialogDescription className="text-slate-400">{alert.message}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs">
                  Correlated Events ({alert.related_events.length})
                </TabsTrigger>
                <TabsTrigger value="impact" className="text-xs">
                  Business & Loss Impact
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Target Asset</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{alert.asset_name || "Enterprise Scope"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Threat Actor</span>
                    <p className="text-sm font-semibold text-purple-400 mt-0.5">{alert.threat_actor || "Unknown"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">MITRE Technique</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{alert.mitre_technique || "T1190"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Assigned Responder</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{alert.assigned_to || "Unassigned"}</p>
                  </div>
                </div>

                {alert.incident_id && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Linked Incident</span>
                      <p className="text-sm font-semibold text-red-400 mt-0.5">{alert.incident_title || alert.incident_id}</p>
                    </div>
                    <Flame className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="events" className="space-y-2 pt-3">
                {alert.related_events.map((ev) => (
                  <div
                    key={ev.event_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-indigo-300">{ev.type}</span>
                      <p className="text-slate-400 font-sans mt-0.5">{new Date(ev.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      {ev.source}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="impact" className="space-y-4 pt-3">
                <div className="p-4 bg-gradient-to-r from-red-950/30 to-slate-950 border border-red-900/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-red-300 font-medium">Estimated Financial Impact</span>
                    <p className="text-xl font-bold text-red-400 mt-0.5">
                      ${(alert.financial_impact / 1000000).toFixed(1)}M USD
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500/40" />
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Impacted Business Service</span>
                  <p className="text-sm font-semibold text-slate-200">{alert.business_service_name || "Digital Banking Core"}</p>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-3 pt-3">
                {alert.timeline_events.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">{t.action}</span>
                      <span className="text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400">{t.details}</p>
                    <span className="text-[11px] text-indigo-400 mt-1 block">Actor: {t.actor}</span>
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
