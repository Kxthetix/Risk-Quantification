"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skull, DollarSign, Target, Server, Shield } from "lucide-react";
import { useThreatActorDetail } from "../hooks";

interface ThreatActorDetailModalProps {
  actorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThreatActorDetailModal({ actorId, open, onOpenChange }: ThreatActorDetailModalProps) {
  const { data: actor, isLoading } = useThreatActorDetail(actorId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !actor ? (
          <div className="py-12 text-center text-slate-500">Loading Adversary Profile...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-purple-700 bg-purple-950/50 text-purple-300 text-xs">
                  {actor.capability} Capability
                </Badge>
                <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                  Risk: {actor.risk_score.toFixed(1)}/100
                </Badge>
                <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                  {actor.observed_activity_level} Activity Level
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100 mt-2">{actor.name}</DialogTitle>
              <DialogDescription className="text-slate-400">{actor.motivation}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="overview" className="text-xs">
                  Overview & TTPs
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="text-xs">
                  Campaigns ({actor.campaigns.length})
                </TabsTrigger>
                <TabsTrigger value="iocs" className="text-xs">
                  Known IOCs ({actor.known_iocs.length})
                </TabsTrigger>
                <TabsTrigger value="exposure" className="text-xs">
                  Exposure & Financials
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="text-xs text-slate-400">Adversary Profile Overview</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{actor.description}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Observed MITRE ATT&CK Techniques</span>
                  <div className="flex flex-wrap gap-1.5">
                    {actor.mitre_techniques.map((tech) => (
                      <Badge key={tech} variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Target Industry Sectors</span>
                  <div className="flex flex-wrap gap-1.5">
                    {actor.target_sectors.map((sec) => (
                      <Badge key={sec} variant="outline" className="border-indigo-900 bg-indigo-950/40 text-indigo-300 text-xs">
                        {sec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-2 pt-3">
                {actor.campaigns.map((cmp) => (
                  <div
                    key={cmp.campaign_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-semibold text-slate-200">{cmp.name}</span>
                      <p className="text-xs text-slate-500 font-mono">ID: {cmp.campaign_id}</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-800 bg-emerald-950/50 text-emerald-400 text-xs">
                      {cmp.status}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="iocs" className="space-y-2 pt-3">
                {actor.known_iocs.map((ioc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-indigo-300 font-semibold">{ioc.indicator}</span>
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      {ioc.type} · {ioc.confidence}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="exposure" className="space-y-4 pt-3">
                <div className="p-4 bg-gradient-to-r from-purple-950/30 to-slate-950 border border-purple-900/40 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-purple-300 font-medium">Estimated Financial Exposure</span>
                    <p className="text-xl font-bold text-purple-400 mt-0.5">${(actor.financial_exposure / 1000000).toFixed(1)}M USD</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500/50" />
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Targeted Internal Assets</span>
                  {actor.targeted_assets.map((asset) => (
                    <div
                      key={asset.asset_id}
                      className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-200 font-semibold">{asset.name}</span>
                      </div>
                      <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                        {asset.criticality || "CRITICAL"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
