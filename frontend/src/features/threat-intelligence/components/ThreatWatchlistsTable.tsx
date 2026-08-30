"use client";

import React, { useState } from "react";
import { ThreatWatchlist } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, Plus, ShieldAlert, ListChecks } from "lucide-react";
import { WatchlistModal } from "./WatchlistModal";

interface ThreatWatchlistsTableProps {
  watchlists: ThreatWatchlist[];
  isLoading?: boolean;
}

export function ThreatWatchlistsTable({ watchlists, isLoading }: ThreatWatchlistsTableProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-400" />
              Custom Threat Watchlists & Proactive Monitors
            </CardTitle>
            <CardDescription className="text-slate-400">
              User-defined high-priority indicator sets, targeted subnets, and adversary tracking rules.
            </CardDescription>
          </div>
          <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Plus className="w-4 h-4" />
            Create Watchlist
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Watchlist Name</TableHead>
                  <TableHead className="text-slate-400">Target Type</TableHead>
                  <TableHead className="text-slate-400">Monitored Indicators</TableHead>
                  <TableHead className="text-slate-400">Recent Hits (24h)</TableHead>
                  <TableHead className="text-slate-400">Triggered Alerts</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading watchlists...
                    </TableCell>
                  </TableRow>
                ) : watchlists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No custom watchlists created yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  watchlists.map((w) => (
                    <TableRow key={w.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <span className="font-semibold text-slate-100">{w.name}</span>
                        {w.description && <p className="text-xs text-slate-400 mt-0.5">{w.description}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                          {w.item_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-300 font-semibold">{w.indicators.length} targets</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-amber-400 font-bold">{w.recent_matches_count} matches</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-red-400 font-bold">{w.alerts_count} alerts</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 text-xs">
                          {w.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <WatchlistModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
