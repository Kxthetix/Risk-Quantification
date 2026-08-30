"use client";

import React, { useState } from "react";
import { PlaybookItem } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, Eye, Play, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PlaybookDryRunModal } from "./PlaybookDryRunModal";
import { PLAYBOOK_CATEGORIES } from "../constants";

interface PlaybooksTableProps {
  playbooks: PlaybookItem[];
  isLoading?: boolean;
}

export function PlaybooksTable({ playbooks, isLoading }: PlaybooksTableProps) {
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dryRunPlaybookId, setDryRunPlaybookId] = useState<string | null>(null);

  const filtered = playbooks.filter((pb) => {
    const matchesCat = category === "ALL" || pb.category === category;
    const matchesSearch =
      pb.name.toLowerCase().includes(search.toLowerCase()) ||
      pb.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              SOAR Automated Response Playbooks
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Deterministic incident containment, evidence collection, and remediation response playbooks.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-56">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search playbooks..."
                className="pl-9 bg-slate-950 border-slate-800 text-slate-200 text-xs h-9"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {PLAYBOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
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
                  <TableHead className="text-slate-400">Playbook Name</TableHead>
                  <TableHead className="text-slate-400">Category</TableHead>
                  <TableHead className="text-slate-400">Trigger</TableHead>
                  <TableHead className="text-slate-400">Steps</TableHead>
                  <TableHead className="text-slate-400">Success Rate</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading playbooks...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No response playbooks configured.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((pb) => (
                    <TableRow key={pb.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors text-xs">
                      <TableCell>
                        <span className="font-semibold text-slate-100">{pb.name}</span>
                        <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1 max-w-md">{pb.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-[10px]">
                          {pb.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-indigo-300 font-medium">{pb.trigger_type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-300">{pb.steps_count} Steps</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-emerald-400 font-bold">{pb.success_rate_pct}%</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 text-[10px]">
                          {pb.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDryRunPlaybookId(pb.id)}
                          className="text-amber-400 hover:text-amber-300 text-xs h-8 px-2"
                          title="Dry Run Simulation"
                        >
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Dry Run
                        </Button>
                        <Link href={`/soc/playbooks/${pb.id}`}>
                          <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Inspect
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

      {dryRunPlaybookId && (
        <PlaybookDryRunModal
          playbookId={dryRunPlaybookId}
          open={Boolean(dryRunPlaybookId)}
          onOpenChange={(open) => !open && setDryRunPlaybookId(null)}
        />
      )}
    </>
  );
}
