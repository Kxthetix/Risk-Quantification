"use client";

import React, { useState } from "react";
import { SecurityEvent } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Search, Eye, Activity, ShieldAlert, Wifi } from "lucide-react";
import { EVENT_SEVERITIES, EVENT_TYPES } from "../constants";
import { useRealtimeSecurityEvents } from "../hooks";
import { EventDetailModal } from "./EventDetailModal";

export function RealtimeEventStream() {
  const [severity, setSeverity] = useState("ALL");
  const [eventType, setEventType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const { data, isLoading, isPaused, togglePause, connectionState } = useRealtimeSecurityEvents({
    severity: severity === "ALL" ? undefined : severity,
    event_type: eventType === "ALL" ? undefined : eventType,
    search: search || undefined,
  });

  const events = data?.events || [];

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live Security Event Ingestion Stream
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1.5 font-medium ${
                  connectionState === "Connected"
                    ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                    : "border-amber-800 bg-amber-950/40 text-amber-300"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${connectionState === "Connected" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {connectionState}
              </Badge>
            </div>
            <CardDescription className="text-slate-400 mt-1">
              Raw and normalized telemetry stream ingested from EDR, WAF, SIEM, and CloudTrails.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IP, host, command..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {EVENT_SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={togglePause}
              className={`h-9 border-slate-700 text-xs gap-1.5 ${
                isPaused ? "bg-amber-950/40 text-amber-300 border-amber-800" : "bg-slate-800 text-slate-200"
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? "Resume Stream" : "Pause Stream"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Timestamp</TableHead>
                  <TableHead className="text-slate-400">Event Type & Rule</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Source IP ➔ Target Asset</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      Streaming security events...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      No security events match current stream filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((ev) => (
                    <TableRow key={ev.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors font-mono text-xs">
                      <TableCell className="text-slate-400 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-100">{ev.event_type}</span>
                        {ev.detection_rule_name && (
                          <p className="text-[11px] font-sans text-indigo-400 mt-0.5">{ev.detection_rule_name}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-[10px]">
                          {ev.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-indigo-300">{ev.source_ip || "Internal"}</span>
                        <span className="text-slate-500 mx-1">➔</span>
                        <span className="text-slate-200 font-semibold">{ev.asset_name || "Perimeter Gateway"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            ev.severity === "CRITICAL"
                              ? "bg-red-950/50 text-red-400 border-red-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {ev.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            ev.status === "ALERT_GENERATED"
                              ? "border-red-800 bg-red-950/40 text-red-400"
                              : "border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {ev.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveEventId(ev.id)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Event
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

      {activeEventId && (
        <EventDetailModal
          eventId={activeEventId}
          open={Boolean(activeEventId)}
          onOpenChange={(open) => !open && setActiveEventId(null)}
        />
      )}
    </>
  );
}
