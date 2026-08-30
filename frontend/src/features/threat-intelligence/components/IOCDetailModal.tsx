"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Server, Network, DollarSign, Activity, ExternalLink } from "lucide-react";
import { useIOCDetail } from "../hooks";

interface IOCDetailModalProps {
  iocId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IOCDetailModal({ iocId, open, onOpenChange }: IOCDetailModalProps) {
  const { data: ioc, isLoading } = useIOCDetail(iocId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !ioc ? (
          <div className="py-12 text-center text-slate-500">Loading IOC Deep Inspection...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-indigo-700 bg-indigo-950/50 text-indigo-300 text-xs">
                  {ioc.ioc_type}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    ioc.severity === "CRITICAL"
                      ? "bg-red-950/50 text-red-400 border-red-800"
                      : "bg-amber-950/50 text-amber-400 border-amber-800"
                  }`}
                >
                  {ioc.severity} Severity
                </Badge>
                <Badge variant="outline" className="border-purple-800 bg-purple-950/50 text-purple-300 text-xs">
                  {ioc.confidence} Confidence
                </Badge>
              </div>
              <DialogTitle className="text-xl font-mono font-bold text-slate-100 mt-2">{ioc.indicator}</DialogTitle>
              <DialogDescription className="text-slate-400">{ioc.threat_classification}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="assets" className="text-xs">
                  Affected Assets ({ioc.affected_assets.length})
                </TabsTrigger>
                <TabsTrigger value="events" className="text-xs">
                  Correlated Events ({ioc.related_events.length})
                </TabsTrigger>
                <TabsTrigger value="risk" className="text-xs">
                  Attack Paths & Risk
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Associated Threat Actor</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{ioc.threat_actor || "Unassigned"}</p>
                  </div>
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-400">Intelligence Sources</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">{ioc.sources.join(", ")}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Mapped MITRE ATT&CK Techniques</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ioc.mitre_techniques.map((tech) => (
                      <Badge key={tech} variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-950/30 to-slate-950 border border-red-900/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-red-300 font-medium">Financial Exposure from this IOC</span>
                    <p className="text-xl font-bold text-red-400 mt-0.5">${(ioc.financial_exposure / 1000000).toFixed(1)}M USD</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500/50" />
                </div>
              </TabsContent>

              <TabsContent value="assets" className="space-y-2 pt-3">
                {ioc.affected_assets.map((asset) => (
                  <div
                    key={asset.asset_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-sm font-semibold text-slate-200">{asset.name}</span>
                        <p className="text-xs text-slate-500 font-mono">{asset.ip || "No IP"}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                      {asset.criticality || "CRITICAL"}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="events" className="space-y-2 pt-3">
                {ioc.related_events.map((ev) => (
                  <div
                    key={ev.event_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-indigo-300 font-bold">{ev.type}</span>
                      <p className="text-slate-400 mt-0.5">{new Date(ev.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      ID: {ev.event_id}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="risk" className="space-y-3 pt-3">
                {ioc.attack_paths.map((path) => (
                  <div key={path.path_id} className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200">{path.name}</span>
                      <Badge className="bg-red-950/60 text-red-400 border-red-800 text-xs">Score: {path.risk_score}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">
                      Adversaries leveraging this IOC can traverse from the external perimeter to internal transactional databases.
                    </p>
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
