"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/badge";
import {
  ArrowDown,
  ShieldAlert,
  Globe,
  Server,
  Database,
  Key,
  Bug,
  Lock,
  CheckCircle2,
  ExternalLink,
  Target,
} from "lucide-react";
import { AttackPathNode } from "../types";
import { NODE_TYPE_CONFIG } from "../constants";

export interface AttackStepTimelineProps {
  nodes: AttackPathNode[];
  onSelectNode?: (nodeId: string) => void;
}

export function AttackStepTimeline({ nodes, onSelectNode }: AttackStepTimelineProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
        No detailed attack steps recorded for this path.
      </div>
    );
  }

  const sortedNodes = [...nodes].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {sortedNodes.map((node, index) => {
        const config =
          NODE_TYPE_CONFIG[node.node_type.toUpperCase()] || NODE_TYPE_CONFIG.ASSET;
        const isTarget = index === sortedNodes.length - 1;
        const isEntry = index === 0;

        return (
          <div
            key={node.id || index}
            className="relative group transition-all duration-200"
            onClick={() => onSelectNode?.(node.id)}
          >
            {/* Step Number Dot on the line */}
            <div
              className={`absolute -left-[30px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-mono font-bold transition-transform group-hover:scale-110 shadow-sm ${
                isTarget
                  ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                  : isEntry
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {index + 1}
            </div>

            {/* Step Card Content */}
            <div className="border border-border bg-card/80 rounded-lg p-3.5 hover:border-primary/50 transition-colors shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-xs text-foreground">
                    {node.label || `Hop #${index + 1}`}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
                    {config.label}
                  </span>
                  {isEntry && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                      Entry Point
                    </Badge>
                  )}
                  {isTarget && (
                    <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-500 border-rose-500/20">
                      Target Crown Jewel
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Hop Score: <strong className="text-foreground">{node.score}</strong>
                  </span>
                  <RiskBadge level={node.score >= 80 ? "CRITICAL" : node.score >= 60 ? "HIGH" : "MEDIUM"} />
                </div>
              </div>

              {/* Technique & Asset linkages */}
              <div className="mt-2.5 pt-2.5 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                {node.technique && (
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>
                      MITRE:{" "}
                      <strong className="text-foreground font-mono">
                        {node.technique.technique_id}
                      </strong>{" "}
                      ({node.technique.name})
                    </span>
                  </div>
                )}

                {node.asset_id && (
                  <div className="flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>
                      Asset ID:{" "}
                      <Link
                        href={`/assets/${node.asset_id}`}
                        className="text-primary hover:underline font-mono"
                      >
                        {String(node.asset_id).slice(0, 8)}…
                      </Link>
                    </span>
                  </div>
                )}
              </div>

              {/* Evidence description if metadata exists */}
              {node.node_metadata && (
                <div className="mt-2 p-2 rounded bg-muted/30 text-[10px] font-mono text-muted-foreground">
                  {JSON.stringify(node.node_metadata)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
