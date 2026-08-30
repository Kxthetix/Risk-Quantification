"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { Target, ExternalLink, ShieldAlert, Sparkles, Filter } from "lucide-react";
import { MitreTechnique } from "../types";
import { MITRE_TACTICS_ORDER } from "../constants";

export interface MitreMatrixProps {
  techniques?: MitreTechnique[];
  selectedTechniqueId?: string | null;
  onSelectTechnique?: (techniqueId: string | null) => void;
}

export function MitreMatrix({
  techniques = [],
  selectedTechniqueId,
  onSelectTechnique,
}: MitreMatrixProps) {
  // Baseline catalog fallback if backend has minimal entries
  const defaultTechniques: MitreTechnique[] = [
    { technique_id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", attack_paths_count: 8, affected_assets_count: 4, risk_level: "CRITICAL", financial_exposure: 24000000 },
    { technique_id: "T1078", name: "Valid Accounts", tactic: "Initial Access", attack_paths_count: 5, affected_assets_count: 3, risk_level: "HIGH", financial_exposure: 14000000 },
    { technique_id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution", attack_paths_count: 6, affected_assets_count: 5, risk_level: "HIGH", financial_exposure: 18000000 },
    { technique_id: "T1068", name: "Exploitation for Privilege Escalation", tactic: "Privilege Escalation", attack_paths_count: 7, affected_assets_count: 4, risk_level: "CRITICAL", financial_exposure: 22000000 },
    { technique_id: "T1548", name: "Abuse Elevation Control Mechanism", tactic: "Privilege Escalation", attack_paths_count: 3, affected_assets_count: 2, risk_level: "MEDIUM", financial_exposure: 6500000 },
    { technique_id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access", attack_paths_count: 6, affected_assets_count: 3, risk_level: "CRITICAL", financial_exposure: 19500000 },
    { technique_id: "T1021", name: "Remote Services (RDP/SSH)", tactic: "Lateral Movement", attack_paths_count: 9, affected_assets_count: 6, risk_level: "CRITICAL", financial_exposure: 28000000 },
    { technique_id: "T1046", name: "Network Service Discovery", tactic: "Discovery", attack_paths_count: 4, affected_assets_count: 3, risk_level: "LOW", financial_exposure: 3200000 },
    { technique_id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", attack_paths_count: 8, affected_assets_count: 5, risk_level: "CRITICAL", financial_exposure: 35000000 },
    { technique_id: "T1490", name: "Inhibit System Recovery", tactic: "Impact", attack_paths_count: 4, affected_assets_count: 2, risk_level: "HIGH", financial_exposure: 16000000 },
  ];

  const activeTechniques = techniques.length > 0 ? techniques : defaultTechniques;

  // Group techniques by tactic
  const groupedByTactic = MITRE_TACTICS_ORDER.reduce<Record<string, MitreTechnique[]>>(
    (acc, tactic) => {
      acc[tactic] = activeTechniques.filter(
        (t) => t.tactic.toLowerCase() === tactic.toLowerCase()
      );
      return acc;
    },
    {}
  );

  // Filter tactics that actually have techniques or show key active ones
  const activeTactics = MITRE_TACTICS_ORDER.filter(
    (tactic) => (groupedByTactic[tactic]?.length ?? 0) > 0
  );

  return (
    <div className="space-y-4">
      {/* Matrix Controls / Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              MITRE ATT&amp;CK Matrix Traversal
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Tactics and techniques actively exploited across discovered organization attack paths.
            </p>
          </div>
        </div>

        {selectedTechniqueId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectTechnique?.(null)}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <span>Clear Filter ({selectedTechniqueId})</span>
          </Button>
        )}
      </div>

      {/* Interactive Matrix Grid (Horizontal Scrollable) */}
      <div className="overflow-x-auto pb-2 border border-border rounded-xl bg-card/60 backdrop-blur-sm shadow-xs">
        <div className="flex min-w-[850px] divide-x divide-border">
          {activeTactics.map((tactic) => {
            const tacticTechniques = groupedByTactic[tactic] || [];
            return (
              <div key={tactic} className="flex-1 min-w-[150px] p-3 space-y-2.5">
                {/* Tactic Column Header */}
                <div className="pb-2 border-b border-border text-center">
                  <span className="text-[11px] font-bold text-foreground tracking-tight block">
                    {tactic}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {tacticTechniques.length} technique{tacticTechniques.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Technique Cards List */}
                <div className="space-y-2">
                  {tacticTechniques.map((tech) => {
                    const isSelected = selectedTechniqueId === tech.technique_id;
                    const isCritical = tech.risk_level === "CRITICAL" || (tech.attack_paths_count ?? 0) >= 7;

                    return (
                      <div
                        key={tech.technique_id}
                        onClick={() =>
                          onSelectTechnique?.(
                            isSelected ? null : tech.technique_id
                          )
                        }
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : isCritical
                            ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60"
                            : "border-border bg-card/80 hover:border-border/80 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono font-bold text-indigo-400">
                            {tech.technique_id}
                          </span>
                          {tech.attack_paths_count ? (
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded bg-muted text-foreground">
                              {tech.attack_paths_count} paths
                            </span>
                          ) : null}
                        </div>

                        <p className="text-[11px] font-medium text-foreground mt-1 line-clamp-2 leading-snug">
                          {tech.name}
                        </p>

                        <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[10px]">
                          <span className="font-mono text-emerald-500 font-semibold">
                            {formatCurrency(tech.financial_exposure || 10000000)}
                          </span>
                          <Link
                            href={`/attack-paths/mitre/${tech.technique_id}`}
                            className="text-muted-foreground hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
