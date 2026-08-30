"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ExternalLink,
  ShieldAlert,
  Server,
  Database,
  Key,
  Bug,
  Briefcase,
  TrendingUp,
  X,
} from "lucide-react";
import { GraphVisualNode } from "../types";
import { NODE_TYPE_CONFIG } from "../constants";

export interface SelectedNodePanelProps {
  node: GraphVisualNode | null;
  onClose?: () => void;
}

export function SelectedNodePanel({ node, onClose }: SelectedNodePanelProps) {
  if (!node) return null;

  const config =
    NODE_TYPE_CONFIG[node.type.toUpperCase()] || NODE_TYPE_CONFIG.ASSET;

  return (
    <Card className="border border-border bg-card/90 backdrop-blur-md shadow-md animate-in fade-in slide-in-from-right-4 duration-200">
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color} ${config.border}`}>
              {config.label}
            </span>
            {node.is_entry_point && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                ENTRY POINT
              </span>
            )}
          </div>
          <CardTitle className="text-sm font-bold text-foreground">
            {node.label}
          </CardTitle>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <div>
            <span className="text-[10px] block text-muted-foreground/80 uppercase">Risk Score</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {node.risk_score} / 100
            </span>
          </div>
          <div>
            <span className="text-[10px] block text-muted-foreground/80 uppercase">Criticality</span>
            <span className="font-semibold text-rose-500">
              {node.criticality || (node.risk_score >= 80 ? "CRITICAL" : "HIGH")}
            </span>
          </div>
          <div>
            <span className="text-[10px] block text-muted-foreground/80 uppercase">Perimeter Exposure</span>
            <span className="font-medium text-foreground">
              {node.is_entry_point ? "Direct Internet / VPN" : "Internal Subnet"}
            </span>
          </div>
          <div>
            <span className="text-[10px] block text-muted-foreground/80 uppercase">Financial Exposure</span>
            <span className="font-mono font-semibold text-emerald-500">
              {formatCurrency(node.risk_score * 350000)}
            </span>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="pt-2 border-t border-border flex flex-col gap-1.5">
          {node.asset_id && (
            <Button variant="outline" size="sm" asChild className="h-7 text-xs justify-between">
              <Link href={`/assets/${node.asset_id}`}>
                <span className="flex items-center gap-1.5">
                  <Server className="h-3 w-3 text-primary" />
                  <span>Open Asset Details</span>
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
          )}

          {node.vulnerability_id && (
            <Button variant="outline" size="sm" asChild className="h-7 text-xs justify-between">
              <Link href={`/vulnerabilities/${node.vulnerability_id}`}>
                <span className="flex items-center gap-1.5">
                  <Bug className="h-3 w-3 text-amber-500" />
                  <span>Open Vulnerability</span>
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            </Button>
          )}

          <Button variant="outline" size="sm" asChild className="h-7 text-xs justify-between">
            <Link href="/risk-quantification">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span>View Financial Loss Model</span>
              </span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
