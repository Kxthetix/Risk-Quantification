"use client";

import React, { useState } from "react";
import { ThreatActor } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Eye, Skull, Target, Shield } from "lucide-react";
import { ThreatActorDetailModal } from "./ThreatActorDetailModal";

interface ThreatActorsTableProps {
  actors: ThreatActor[];
  isLoading?: boolean;
}

export function ThreatActorsTable({ actors, isLoading }: ThreatActorsTableProps) {
  const [activeActorId, setActiveActorId] = useState<string | null>(null);

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Adversary & Threat Actor Intelligence Profiles
          </CardTitle>
          <CardDescription className="text-slate-400">
            Track nation-state, ransomware cartels, and organized cybercrime syndicates targeting your industry sector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Actor Name & Aliases</TableHead>
                  <TableHead className="text-slate-400">Motivation</TableHead>
                  <TableHead className="text-slate-400">Capability</TableHead>
                  <TableHead className="text-slate-400">Active Campaigns</TableHead>
                  <TableHead className="text-slate-400">Target Sectors</TableHead>
                  <TableHead className="text-slate-400">Risk Score</TableHead>
                  <TableHead className="text-slate-400 text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading Threat Actors...
                    </TableCell>
                  </TableRow>
                ) : actors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No threat actors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  actors.map((actor) => (
                    <TableRow key={actor.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-semibold text-slate-100">{actor.name}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{actor.aliases.join(", ") || "No known aliases"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-300">{actor.motivation}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            actor.capability === "ELITE"
                              ? "bg-purple-950/60 text-purple-300 border-purple-800"
                              : "bg-indigo-950/60 text-indigo-300 border-indigo-800"
                          }`}
                        >
                          {actor.capability}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-300 font-semibold">{actor.active_campaigns_count}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {actor.target_sectors.slice(0, 2).map((sec) => (
                            <Badge key={sec} variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-xs">
                              {sec}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-bold ${
                            actor.risk_score >= 90
                              ? "bg-red-950/60 text-red-400 border-red-800"
                              : "bg-amber-950/60 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {actor.risk_score.toFixed(1)}/100
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveActorId(actor.id)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Profile
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

      {activeActorId && (
        <ThreatActorDetailModal
          actorId={activeActorId}
          open={Boolean(activeActorId)}
          onOpenChange={(open) => !open && setActiveActorId(null)}
        />
      )}
    </>
  );
}
