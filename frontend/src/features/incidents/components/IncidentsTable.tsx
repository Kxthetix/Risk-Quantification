"use client";

import React, { useState } from "react";
import { IncidentItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Flame, Eye, Plus, Search, ShieldAlert, DollarSign } from "lucide-react";
import { INCIDENT_STATUSES } from "../constants";
import { IncidentDetailModal } from "./IncidentDetailModal";
import { CreateIncidentModal } from "./CreateIncidentModal";

interface IncidentsTableProps {
  incidents: IncidentItem[];
  isLoading?: boolean;
}

export function IncidentsTable({ incidents, isLoading }: IncidentsTableProps) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesStatus = status === "ALL" || inc.status === status;
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.description.toLowerCase().includes(search.toLowerCase()) ||
      (inc.owner && inc.owner.toLowerCase().includes(search.toLowerCase())) ||
      (inc.business_service_name && inc.business_service_name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Incident Response & Active Breach Management
            </CardTitle>
            <CardDescription className="text-slate-400">
              End-to-end incident lifecycle: triage, active containment, evidence forensics, task management, and SOAR response.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search incident, owner..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {INCIDENT_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            <Button onClick={() => setCreateModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white text-xs gap-1.5 h-9">
              <Plus className="w-4 h-4" />
              New Incident
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">ID & Incident Title</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Business Service</TableHead>
                  <TableHead className="text-slate-400">Financial Exposure</TableHead>
                  <TableHead className="text-slate-400">Owner & Assigned</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading incidents...
                    </TableCell>
                  </TableRow>
                ) : filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No security incidents found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((inc) => (
                    <TableRow key={inc.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs text-indigo-400 font-bold">{inc.incident_number}</span>
                          <span className="block font-semibold text-slate-100 mt-0.5">{inc.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
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
                        <span className="text-xs text-slate-200 font-medium">
                          {inc.business_service_name || "Enterprise Services"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-red-400 font-bold">
                          ${(inc.financial_exposure / 1000000).toFixed(1)}M
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-300">{inc.owner || "Incident Queue"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            inc.status === "INVESTIGATING"
                              ? "border-purple-800 bg-purple-950/50 text-purple-300"
                              : inc.status === "CONTAINED"
                              ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
                              : "border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveIncidentId(inc.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          War Room
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

      {activeIncidentId && (
        <IncidentDetailModal
          incidentId={activeIncidentId}
          open={Boolean(activeIncidentId)}
          onOpenChange={(open) => !open && setActiveIncidentId(null)}
        />
      )}

      <CreateIncidentModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </>
  );
}
