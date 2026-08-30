"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { AttackPath } from "../types";
import { ArrowRight, GitCompare, ShieldAlert, Target, TrendingUp } from "lucide-react";

export interface AttackPathComparisonProps {
  paths: AttackPath[];
}

export function AttackPathComparison({ paths }: AttackPathComparisonProps) {
  if (!paths || paths.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
        Select 2 or more attack paths to view side-by-side comparative analysis.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {paths.map((p, idx) => (
        <Card key={p.id || idx} className="border border-border bg-card/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">
                Path #{idx + 1}
              </span>
              <RiskBadge level={p.path_score >= 80 ? "CRITICAL" : "HIGH"} />
            </div>
            <CardTitle className="text-sm font-bold text-foreground truncate">
              {p.source_node} → {p.target_node}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Composite Risk Score:</span>
                <strong className="text-foreground font-mono">{p.path_score} / 100</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Financial Exposure:</span>
                <strong className="text-emerald-500 font-mono">
                  {formatCurrency(p.financial_exposure)}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Traversal Depth:</span>
                <strong className="text-foreground font-mono">{p.path_length} hops</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Likelihood:</span>
                <strong className="text-foreground font-mono">{Math.round(p.likelihood * 100)}%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge status={p.status} />
              </div>
            </div>

            {/* Traversal nodes summary */}
            {p.nodes && p.nodes.length > 0 && (
              <div className="pt-2 border-t border-border space-y-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Intermediate Nodes:
                </span>
                <div className="space-y-1">
                  {p.nodes.map((n, nIdx) => (
                    <div key={n.id || nIdx} className="text-[11px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                      <span className="truncate">{n.label || `Node ${nIdx + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
