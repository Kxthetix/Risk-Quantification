"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, ShieldAlert, Terminal, Server, Layers } from "lucide-react";
import { useSecurityEventDetail } from "../hooks";

interface EventDetailModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ eventId, open, onOpenChange }: EventDetailModalProps) {
  const { data: event, isLoading } = useSecurityEventDetail(eventId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !event ? (
          <div className="py-12 text-center text-slate-500">Loading Event Telemetry...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-700 bg-indigo-950/50 text-indigo-300 text-xs">
                  {event.source}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    event.severity === "CRITICAL"
                      ? "bg-red-950/50 text-red-400 border-red-800"
                      : "bg-amber-950/50 text-amber-400 border-amber-800"
                  }`}
                >
                  {event.severity} Severity
                </Badge>
                <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                  {event.status}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold font-mono text-slate-100 mt-2">{event.event_type}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Triggered at {new Date(event.timestamp).toLocaleString()} by {event.detection_rule_name || "Detection Rule"}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="telemetry" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="telemetry" className="text-xs">
                  Event Telemetry
                </TabsTrigger>
                <TabsTrigger value="intel" className="text-xs">
                  Threat Intel & MITRE
                </TabsTrigger>
                <TabsTrigger value="impact" className="text-xs">
                  Attack Path & Financial Impact
                </TabsTrigger>
              </TabsList>

              <TabsContent value="telemetry" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Source IP / Host</span>
                    <p className="text-sm font-mono text-indigo-300 font-bold mt-0.5">{event.source_ip || "Internal"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Destination IP / Target</span>
                    <p className="text-sm font-mono text-slate-200 font-bold mt-0.5">
                      {event.destination_ip || "10.0.1.15"} ({event.asset_name})
                    </p>
                  </div>
                </div>

                {event.command_line && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Executed Command Line
                    </span>
                    <pre className="p-2 bg-slate-900 rounded font-mono text-xs text-amber-300 overflow-x-auto">
                      {event.command_line}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-slate-400">Process Name:</span>
                    <span className="text-slate-200 font-mono ml-2">{event.process_name || "N/A"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-slate-400">Authenticated User:</span>
                    <span className="text-slate-200 font-mono ml-2">{event.username || "N/A"}</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="intel" className="space-y-4 pt-3">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Correlated Threat Actor</span>
                  <p className="text-sm font-bold text-purple-400 mt-0.5">{event.threat_actor || "Unknown Adversary"}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">MITRE ATT&CK Technique</span>
                  <p className="text-sm font-semibold text-slate-200 mt-0.5">{event.mitre_technique || "T1190 - Initial Access"}</p>
                </div>
              </TabsContent>

              <TabsContent value="impact" className="space-y-4 pt-3">
                <div className="p-4 bg-gradient-to-r from-red-950/30 to-slate-950 border border-red-900/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-red-300 font-medium">Quantified Asset Loss Exposure</span>
                    <p className="text-xl font-bold text-red-400 mt-0.5">
                      ${(event.financial_exposure / 1000000).toFixed(1)}M USD
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500/40" />
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Traversed Attack Path</span>
                  <p className="text-xs font-semibold text-slate-200">{event.attack_path_name || "Ingress -> Payments Gateway -> DB"}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Impacted Business Service</span>
                  <p className="text-xs font-semibold text-slate-200">{event.affected_business_service || "Digital Banking Core"}</p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
