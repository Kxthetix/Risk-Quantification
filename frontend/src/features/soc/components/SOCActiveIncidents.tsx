"use client";

import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, ShieldAlert, Eye, UserCheck, Shield } from "lucide-react";
import Link from "next/link";
import { IncidentTriageModal } from "./IncidentTriageModal";

interface SOCActiveIncidentsProps {
  incidents?: Array<{
    id: string;
    incident_number: string;
    title: string;
    severity: string;
    status: string;
    owner: string;
    business_service: string;
    financial_exposure: number;
    created_at: string;
  }>;
  isLoading?: boolean;
}

export function SOCActiveIncidents({ incidents = [], isLoading }: SOCActiveIncidentsProps) {
  const [triageIncidentId, setTriageIncidentId] = useState<string | null>(null);

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Active High-Priority Incidents
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Active operational incidents currently under investigation and containment.
            </CardDescription>
          </div>
          <Link href="/soc/incidents">
            <Button variant="outline" size="sm" className="text-xs border-slate-700 bg-slate-950 text-slate-200">
              View All Incidents
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Incident</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Business Service</TableHead>
                  <TableHead className="text-slate-400">Exposure</TableHead>
                  <TableHead className="text-slate-400">Commander</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                      Loading incidents...
                    </TableCell>
                  </TableRow>
                ) : incidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                      No active security incidents.
                    </TableCell>
                  </TableRow>
                ) : (
                  incidents.map((inc) => (
                    <TableRow key={inc.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                      <TableCell>
                        <span className="font-mono text-indigo-400 font-bold">{inc.incident_number}</span>
                        <p className="font-semibold text-slate-200 mt-0.5">{inc.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            inc.severity === "CRITICAL"
                              ? "bg-red-950/50 text-red-400 border-red-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{inc.business_service}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-red-400 font-bold">
                          ${(inc.financial_exposure / 1000000).toFixed(1)}M
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{inc.owner}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-purple-800 bg-purple-950/50 text-purple-300 text-[10px]">
                          {inc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTriageIncidentId(inc.id)}
                          className="text-amber-400 hover:text-amber-300 text-xs h-7 px-2"
                          title="Triage Incident"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Triage
                        </Button>
                        <Link href={`/soc/incidents/${inc.id}/investigation`}>
                          <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs h-7 px-2">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            War Room
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {triageIncidentId && (
        <IncidentTriageModal
          incidentId={triageIncidentId}
          open={Boolean(triageIncidentId)}
          onOpenChange={(open) => !open && setTriageIncidentId(null)}
        />
      )}
    </>
  );
}
