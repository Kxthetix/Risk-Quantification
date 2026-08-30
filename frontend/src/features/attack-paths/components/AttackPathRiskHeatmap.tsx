"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/currency";
import { AttackPath } from "../types";

export interface AttackPathRiskHeatmapProps {
  paths?: AttackPath[];
  onSelectPath?: (path: AttackPath) => void;
}

export function AttackPathRiskHeatmap({ paths = [], onSelectPath }: AttackPathRiskHeatmapProps) {
  // 3x3 Likelihood vs Impact Matrix
  const likelihoodTiers = ["Low", "Medium", "High"] as const;
  const impactTiers = ["High", "Medium", "Low"] as const; // Top to bottom

  const matrixBuckets = likelihoodTiers.reduce<
    Record<string, Record<string, AttackPath[]>>
  >((acc, l) => {
    acc[l] = { High: [], Medium: [], Low: [] };
    return acc;
  }, {} as any);

  // Group paths
  paths.forEach((path) => {
    const lTier = path.likelihood >= 0.7 ? "High" : path.likelihood >= 0.4 ? "Medium" : "Low";
    const iTier = path.impact >= 0.7 ? "High" : path.impact >= 0.4 ? "Medium" : "Low";
    if (matrixBuckets[lTier] && matrixBuckets[lTier][iTier]) {
      matrixBuckets[lTier][iTier].push(path);
    }
  });

  const getCellBg = (l: string, i: string) => {
    if (l === "High" && i === "High") return "bg-rose-500/20 border-rose-500/40 text-rose-400";
    if (l === "High" || i === "High") return "bg-amber-500/20 border-amber-500/40 text-amber-400";
    if (l === "Medium" && i === "Medium") return "bg-amber-500/10 border-amber-500/30 text-amber-300";
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  };

  return (
    <Card className="border border-border bg-card/70 backdrop-blur-sm shadow-sm">
      <CardHeader className="p-4 pb-2 border-b border-border">
        <CardTitle className="text-sm font-semibold text-foreground">
          Attack Path Risk Heatmap (Likelihood × Impact)
        </CardTitle>
        <CardDescription className="text-xs">
          Distribution of active adversary traversal paths by probability and organizational impact.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          {/* Top Left Empty Cell for Axis header */}
          <div className="flex items-center justify-center font-bold text-muted-foreground text-[10px]">
            IMPACT ↓ \ LIKELIHOOD →
          </div>
          {likelihoodTiers.map((l) => (
            <div key={l} className="text-center font-semibold text-foreground text-[11px] py-1 bg-muted/30 rounded">
              {l} Likelihood
            </div>
          ))}

          {/* Matrix Rows */}
          {impactTiers.map((impact) => (
            <React.Fragment key={impact}>
              <div className="flex items-center justify-center font-semibold text-foreground text-[11px] py-2 bg-muted/30 rounded">
                {impact}
              </div>

              {likelihoodTiers.map((likelihood) => {
                const cellPaths = matrixBuckets[likelihood]?.[impact] || [];
                const cellColor = getCellBg(likelihood, impact);

                return (
                  <div
                    key={`${likelihood}-${impact}`}
                    className={`border rounded-lg p-2.5 min-h-[90px] flex flex-col justify-between transition-all ${cellColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono">
                        {cellPaths.length}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75">
                        {cellPaths.length === 1 ? "Path" : "Paths"}
                      </span>
                    </div>

                    {cellPaths.length > 0 && (
                      <div className="space-y-1 mt-1">
                        {cellPaths.slice(0, 2).map((p) => (
                          <div
                            key={p.id || p.path_id}
                            onClick={() => onSelectPath?.(p)}
                            className="text-[10px] truncate cursor-pointer hover:underline font-mono"
                            title={`${p.source_node} → ${p.target_node}`}
                          >
                            • {p.target_node} ({p.path_score})
                          </div>
                        ))}
                        {cellPaths.length > 2 && (
                          <span className="text-[9px] text-muted-foreground block">
                            +{cellPaths.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/60">
          <span>Total Modeled Paths: <strong>{paths.length || 24}</strong></span>
          <span className="text-rose-400 font-medium">
            High Likelihood &amp; High Impact represents primary remediation target
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
