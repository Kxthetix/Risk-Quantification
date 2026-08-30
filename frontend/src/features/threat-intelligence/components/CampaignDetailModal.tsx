"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Server, Layers, AlertTriangle } from "lucide-react";
import { useThreatCampaignDetail } from "../hooks";

interface CampaignDetailModalProps {
  campaignId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDetailModal({ campaignId, open, onOpenChange }: CampaignDetailModalProps) {
  const { data: campaign, isLoading } = useThreatCampaignDetail(campaignId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading || !campaign ? (
          <div className="py-12 text-center text-slate-500">Loading Campaign Profile...</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-orange-800 bg-orange-950/50 text-orange-400 text-xs">
                  Active Campaign
                </Badge>
                <Badge variant="outline" className="border-purple-800 bg-purple-950/50 text-purple-300 text-xs">
                  Actor: {campaign.threat_actor_name}
                </Badge>
                <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                  Risk: {campaign.risk_score.toFixed(1)}/100
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100 mt-2">{campaign.name}</DialogTitle>
              <DialogDescription className="text-slate-400">{campaign.description}</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="services" className="mt-4">
              <TabsList className="bg-slate-950 border border-slate-800">
                <TabsTrigger value="services" className="text-xs">
                  Business Services & Assets ({campaign.affected_assets.length})
                </TabsTrigger>
                <TabsTrigger value="iocs" className="text-xs">
                  Campaign IOCs ({campaign.iocs.length})
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs">
                  Triggered Alerts ({campaign.related_alerts.length})
                </TabsTrigger>
                <TabsTrigger value="financials" className="text-xs">
                  Financial Exposure
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="space-y-3 pt-3">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Targeted Business Services</span>
                  {campaign.affected_business_services.map((srv) => (
                    <div
                      key={srv.service_id}
                      className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-semibold text-slate-200">{srv.name}</span>
                      </div>
                      <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400 text-xs">
                        {srv.criticality || "CRITICAL"}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Targeted Internal Assets</span>
                  {campaign.affected_assets.map((ast) => (
                    <div
                      key={ast.asset_id}
                      className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-200 font-semibold">{ast.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{ast.ip || "Internal"}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="iocs" className="space-y-2 pt-3">
                {campaign.iocs.map((ioc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-indigo-300 font-semibold">{ioc.indicator}</span>
                    <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                      {ioc.type} · {ioc.severity}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="alerts" className="space-y-2 pt-3">
                {campaign.related_alerts.map((alt) => (
                  <div
                    key={alt.alert_id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-semibold">{alt.title}</span>
                    <Badge variant="outline" className="border-red-800 bg-red-950/50 text-red-400">
                      {alt.severity}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="financials" className="space-y-3 pt-3">
                <div className="p-4 bg-gradient-to-r from-red-950/40 to-slate-950 border border-red-900/50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs text-red-300 font-medium">Aggregated Campaign Loss Exposure</span>
                    <p className="text-2xl font-bold text-red-400 mt-0.5">
                      ${(campaign.financial_exposure / 1000000).toFixed(1)}M USD
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-red-500/40" />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
