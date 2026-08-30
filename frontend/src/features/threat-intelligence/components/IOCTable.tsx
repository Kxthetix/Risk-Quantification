"use client";

import React, { useState } from "react";
import { IOCItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IOC_TYPES } from "../constants";
import { Eye, ShieldAlert, Search, Filter } from "lucide-react";
import { IOCDetailModal } from "./IOCDetailModal";

interface IOCTableProps {
  iocs: IOCItem[];
  isLoading?: boolean;
}

export function IOCTable({ iocs, isLoading }: IOCTableProps) {
  const [selectedType, setSelectedType] = useState("ALL");
  const [search, setSearch] = useState("");
  const [activeIocId, setActiveIocId] = useState<string | null>(null);

  const filteredIocs = iocs.filter((ioc) => {
    const matchesType = selectedType === "ALL" || ioc.ioc_type === selectedType;
    const matchesSearch =
      ioc.indicator.toLowerCase().includes(search.toLowerCase()) ||
      ioc.threat_classification.toLowerCase().includes(search.toLowerCase()) ||
      (ioc.threat_actor && ioc.threat_actor.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Active Indicators of Compromise (IOCs)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Live malicious IPs, domains, hashes, and URLs correlated against your assets and events.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IOC, Actor, C2..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              {IOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
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
                  <TableHead className="text-slate-400">Indicator & Classification</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Threat Actor</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Confidence</TableHead>
                  <TableHead className="text-slate-400">Correlated Events</TableHead>
                  <TableHead className="text-slate-400 text-right">Inspect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading Indicators of Compromise...
                    </TableCell>
                  </TableRow>
                ) : filteredIocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No indicators match the selected criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIocs.map((ioc) => (
                    <TableRow key={ioc.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-100">{ioc.indicator}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{ioc.threat_classification}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-xs">
                          {ioc.ioc_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-300 font-medium">{ioc.threat_actor || "Unassigned"}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            ioc.severity === "CRITICAL"
                              ? "bg-red-950/50 text-red-400 border-red-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {ioc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            ioc.confidence === "CONFIRMED"
                              ? "bg-purple-950/50 text-purple-300 border-purple-800"
                              : "bg-blue-950/50 text-blue-300 border-blue-800"
                          }`}
                          variant="outline"
                        >
                          {ioc.confidence}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-300">
                          {ioc.related_events_count} events · {ioc.affected_assets_count} assets
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveIocId(ioc.id)}
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Detail
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

      {activeIocId && (
        <IOCDetailModal iocId={activeIocId} open={Boolean(activeIocId)} onOpenChange={(open) => !open && setActiveIocId(null)} />
      )}
    </>
  );
}
