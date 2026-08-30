"use client";

import React, { useState } from "react";
import { DetailedAlert } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bell, Eye, UserPlus, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { ALERT_SEVERITIES, ALERT_STATUSES } from "../constants";
import { AlertDetailModal } from "./AlertDetailModal";
import { AlertAssignModal } from "./AlertAssignModal";
import { AlertResolveModal } from "./AlertResolveModal";
import { AlertFalsePositiveModal } from "./AlertFalsePositiveModal";

interface AlertsTableProps {
  alerts: DetailedAlert[];
  isLoading?: boolean;
}

export function AlertsTable({ alerts, isLoading }: AlertsTableProps) {
  const [severity, setSeverity] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [assignAlertId, setAssignAlertId] = useState<string | null>(null);
  const [resolveAlertId, setResolveAlertId] = useState<string | null>(null);
  const [fpAlertId, setFpAlertId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alt) => {
    const matchesSev = severity === "ALL" || alt.severity === severity;
    const matchesStatus = status === "ALL" || alt.status === status;
    const matchesSearch =
      alt.title.toLowerCase().includes(search.toLowerCase()) ||
      alt.message.toLowerCase().includes(search.toLowerCase()) ||
      (alt.asset_name && alt.asset_name.toLowerCase().includes(search.toLowerCase())) ||
      (alt.threat_actor && alt.threat_actor.toLowerCase().includes(search.toLowerCase()));
    return matchesSev && matchesStatus && matchesSearch;
  });

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" />
              Enterprise Security & Anomaly Alerts
            </CardTitle>
            <CardDescription className="text-slate-400">
              Correlated alerts triggered by detection rules, threat scenario models, and posture regressions.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search alert, asset, actor..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {ALERT_SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {ALERT_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Alert Title & Details</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Target Asset</TableHead>
                  <TableHead className="text-slate-400">Threat Actor / TTP</TableHead>
                  <TableHead className="text-slate-400">Status & Assignee</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading security alerts...
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No alerts match the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alt) => (
                    <TableRow key={alt.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-semibold text-slate-100">{alt.title}</span>
                          <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">{alt.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            alt.severity === "CRITICAL"
                              ? "bg-red-950/50 text-red-400 border-red-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {alt.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-200">{alt.asset_name || "Enterprise Scope"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-purple-300 font-medium">{alt.threat_actor || "Unknown"}</span>
                        {alt.mitre_technique && (
                          <span className="block text-[11px] font-mono text-slate-400">{alt.mitre_technique}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            alt.status === "RESOLVED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                              : alt.status === "INVESTIGATING"
                              ? "bg-purple-950/40 text-purple-300 border-purple-800"
                              : "bg-blue-950/40 text-blue-300 border-blue-800"
                          }`}
                        >
                          {alt.status}
                        </Badge>
                        {alt.assigned_to && (
                          <span className="block text-[11px] text-slate-400 mt-0.5">Assigned: {alt.assigned_to}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAssignAlertId(alt.id)}
                          className="text-slate-300 hover:text-white text-xs h-8 px-2"
                          title="Assign Alert"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setResolveAlertId(alt.id)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs h-8 px-2"
                          title="Resolve Alert"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setFpAlertId(alt.id)}
                          className="text-slate-400 hover:text-slate-300 text-xs h-8 px-2"
                          title="Mark False Positive"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveAlertId(alt.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2"
                          title="View Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
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

      {activeAlertId && (
        <AlertDetailModal
          alertId={activeAlertId}
          open={Boolean(activeAlertId)}
          onOpenChange={(open) => !open && setActiveAlertId(null)}
        />
      )}
      {assignAlertId && (
        <AlertAssignModal
          alertId={assignAlertId}
          open={Boolean(assignAlertId)}
          onOpenChange={(open) => !open && setAssignAlertId(null)}
        />
      )}
      {resolveAlertId && (
        <AlertResolveModal
          alertId={resolveAlertId}
          open={Boolean(resolveAlertId)}
          onOpenChange={(open) => !open && setResolveAlertId(null)}
        />
      )}
      {fpAlertId && (
        <AlertFalsePositiveModal
          alertId={fpAlertId}
          open={Boolean(fpAlertId)}
          onOpenChange={(open) => !open && setFpAlertId(null)}
        />
      )}
    </>
  );
}
