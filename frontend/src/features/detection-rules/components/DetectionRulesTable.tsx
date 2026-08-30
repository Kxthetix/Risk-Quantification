"use client";

import React, { useState } from "react";
import { DetectionRule } from "../types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Eye, Play, Plus, Search } from "lucide-react";
import { DetectionRuleDetailModal } from "./DetectionRuleDetailModal";
import { DetectionRuleTesterModal } from "./DetectionRuleTesterModal";

interface DetectionRulesTableProps {
  rules: DetectionRule[];
  isLoading?: boolean;
}

export function DetectionRulesTable({ rules, isLoading }: DetectionRulesTableProps) {
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [testRuleId, setTestRuleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.mitre_technique.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card className="bg-slate-900/60 border-slate-800 shadow-xl backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              SOC Detection Rules & Behavioral Catalog
            </CardTitle>
            <CardDescription className="text-slate-400">
              Active Sigma, YARA, and SQL correlation rules continuously scanning ingested event streams.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setTestRuleId("test-custom")}
              variant="outline"
              className="border-indigo-800 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/40 text-xs gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              Test Rule Sandbox
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-950/80">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Rule Name & Description</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">MITRE Technique</TableHead>
                  <TableHead className="text-slate-400">Matches</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading detection rules...
                    </TableCell>
                  </TableRow>
                ) : filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No detection rules found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id} className="border-slate-800 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <span className="font-semibold text-slate-100">{rule.name}</span>
                        <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">{rule.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-700 bg-slate-800 text-slate-300 text-xs">
                          {rule.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            rule.severity === "CRITICAL"
                              ? "bg-red-950/50 text-red-400 border-red-800"
                              : "bg-amber-950/50 text-amber-400 border-amber-800"
                          }`}
                          variant="outline"
                        >
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-300 font-mono">{rule.mitre_technique}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-indigo-300 font-bold">{rule.matches_count}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-emerald-800 bg-emerald-950/40 text-emerald-400 text-xs">
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setTestRuleId(rule.id)}
                          className="text-amber-400 hover:text-amber-300 text-xs h-8 px-2"
                          title="Test Rule"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveRuleId(rule.id)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs h-8 px-2"
                          title="View Logic"
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

      {activeRuleId && (
        <DetectionRuleDetailModal
          ruleId={activeRuleId}
          open={Boolean(activeRuleId)}
          onOpenChange={(open) => !open && setActiveRuleId(null)}
        />
      )}

      {testRuleId && (
        <DetectionRuleTesterModal
          open={Boolean(testRuleId)}
          onOpenChange={(open) => !open && setTestRuleId(null)}
        />
      )}
    </>
  );
}
