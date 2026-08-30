"use client";

import React, { useState } from "react";
import { ThreatFeed } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, RefreshCw, CheckCircle2, AlertCircle, Play, Shield } from "lucide-react";
import { useTestThreatFeed } from "../hooks";

interface ThreatFeedsTableProps {
  feeds: ThreatFeed[];
  isLoading?: boolean;
  onAddFeed?: () => void;
}

export function ThreatFeedsTable({ feeds, isLoading, onAddFeed }: ThreatFeedsTableProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const testMutation = useTestThreatFeed();

  const handleTestFeed = async (feedId: string) => {
    setTestingId(feedId);
    try {
      await testMutation.mutateAsync(feedId);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            Threat Intelligence Ingestion Feeds
          </CardTitle>
          <CardDescription className="text-slate-400">
            Real-time multi-source external indicators, dark web monitoring & vulnerability feeds.
          </CardDescription>
        </div>
        {onAddFeed && (
          <Button onClick={onAddFeed} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Activity className="w-4 h-4" />
            Add Intel Feed
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-950/80">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Feed Name & Provider</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Indicators</TableHead>
                <TableHead className="text-slate-400">Sync Interval</TableHead>
                <TableHead className="text-slate-400">Health</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Loading threat feeds...
                  </TableCell>
                </TableRow>
              ) : feeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No threat feeds configured. Click &quot;Add Intel Feed&quot; to begin.
                  </TableCell>
                </TableRow>
              ) : (
                feeds.map((feed) => (
                  <TableRow key={feed.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <TableCell>
                      <div>
                        <span className="font-semibold text-slate-100">{feed.name}</span>
                        <p className="text-xs text-slate-400 mt-0.5">{feed.provider}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-700 bg-slate-800/60 text-slate-300 text-xs">
                        {feed.feed_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-indigo-300 font-semibold">
                        {feed.indicators_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-400">Every {feed.polling_interval_minutes}m</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs flex items-center w-fit gap-1 ${
                          feed.health === "HEALTHY"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                            : "bg-amber-950/40 text-amber-400 border-amber-800"
                        }`}
                        variant="outline"
                      >
                        {feed.health === "HEALTHY" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {feed.health}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTestFeed(feed.id)}
                        disabled={testingId === feed.id}
                        className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingId === feed.id ? "animate-spin" : ""}`} />
                        {testingId === feed.id ? "Testing..." : "Test Sync"}
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
  );
}

function Radio(props: any) {
  return <Shield {...props} />;
}
