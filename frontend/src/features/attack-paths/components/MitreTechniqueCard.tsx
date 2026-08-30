"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import { Target, ExternalLink, ShieldAlert, ArrowRight, Layers } from "lucide-react";
import { MitreTechnique } from "../types";

export interface MitreTechniqueCardProps {
  technique: MitreTechnique;
}

export function MitreTechniqueCard({ technique }: MitreTechniqueCardProps) {
  return (
    <Card className="border border-border bg-card/70 backdrop-blur-sm hover:border-primary/50 transition-all shadow-xs">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {technique.technique_id}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {technique.tactic}
            </Badge>
          </div>
          <RiskBadge level={technique.risk_level || "HIGH"} />
        </div>

        <div>
          <h4 className="text-xs font-bold text-foreground line-clamp-1">
            {technique.name}
          </h4>
          {technique.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
              {technique.description}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            <span>Paths: </span>
            <strong className="text-foreground font-mono">
              {technique.attack_paths_count ?? 4}
            </strong>
          </div>
          <div className="font-mono text-emerald-500 font-bold">
            {formatCurrency(technique.financial_exposure || 12000000)}
          </div>
          <Link
            href={`/attack-paths/mitre/${technique.technique_id}`}
            className="text-primary hover:underline flex items-center gap-1 text-[11px]"
          >
            <span>Detail</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
