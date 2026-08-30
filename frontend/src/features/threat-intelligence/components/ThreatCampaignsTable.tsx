"use client";

import React, { useState } from "react";
import { ThreatCampaign } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, Eye, AlertOctagon } from "lucide-react";
import { CampaignDetailModal } from "./CampaignDetailModal";

interface ThreatCampaignsTableProps {
  campaigns: ThreatCampaign[];
  isLoading?: boolean;
}

export function ThreatCampaignsTable({ campaigns, isLoading }: ThreatCampaignsTableProps) {
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Active Threat Campaigns & Operation Waves
          </CardTitle>
          <CardDescription className="text-slate-400">
            Correlate coordinated adversary attack waves against internal business services and attack paths.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Campaign Name</TableHead>
                  <TableHead className="text-slate-400">Threat Actor</TableHead>
                  <TableHead className="text-slate-400">Target Tech / Assets</TableHead>
                  <TableHead className="text-slate-400">IOCs</TableHead>
                  <TableHead className="text-slate-400">Risk Score</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading Campaigns...
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No active adversary campaigns recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((camp) => (
                    <TableRow key={camp.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <span className="font-semibold text-slate-100">{camp.name}</span>
                        <p className="text-xs text-slate-400 mt-0.5">Started {new Date(camp.start_date).toLocaleDateString()}</p>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-purple-300 font-medium">{camp.threat_actor_name}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {camp.targets.map((t) => (
                            <Badge key={t} variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-300">{camp.iocs_count} indicators</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-bold ${
                            camp.risk_score >= 90
                              ? "bg-red-950/60 text-red-400 border-red-800"
                              : "bg-amber-950/60 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {camp.risk_score.toFixed(1)}/100
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 text-xs">
                          {camp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveCampaignId(camp.id)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Wave
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {activeCampaignId && (
        <CampaignDetailModal
          campaignId={activeCampaignId}
          open={Boolean(activeCampaignId)}
          onOpenChange={(open) => !open && setActiveCampaignId(null)}
        />
      )}
    </>
  );
}
