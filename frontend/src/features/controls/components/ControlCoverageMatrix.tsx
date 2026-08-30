import React from "react";
import { SecurityControl } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, Crosshair, Cpu, Database, Cloud, Network } from "lucide-react";

interface ControlCoverageMatrixProps {
  controls: SecurityControl[];
}

export function ControlCoverageMatrix({ controls }: ControlCoverageMatrixProps) {
  const categories = [
    { label: "Web / Ingress Gateways", type: "WAF", icon: Cloud },
    { label: "Host & Workstations", type: "EDR", icon: Cpu },
    { label: "Identity & Access Tier", type: "MFA", icon: ShieldCheck },
    { label: "Network Microsegmentation", type: "NETWORK_SEGMENTATION", icon: Network },
    { label: "Database & Core Datastores", type: "BACKUP", icon: Database },
    { label: "Privileged Infrastructure", type: "PAM", icon: Crosshair },
  ];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              MITRE ATT&amp;CK Defense Layer Coverage
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Active defensive controls aligned to infrastructure security tiers
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const matchedControls = controls.filter((c) => c.control_type === cat.type && c.is_active);
            const isProtected = matchedControls.length > 0;
            const avgEff = isProtected
              ? Math.round(
                  matchedControls.reduce((acc, c) => acc + c.effectiveness_score, 0) /
                    matchedControls.length
                )
              : 0;

            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                  isProtected
                    ? "bg-emerald-500/5 border-emerald-500/20 text-foreground"
                    : "bg-muted/30 border-dashed border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        isProtected ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">{cat.label}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isProtected
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {isProtected ? "ACTIVE" : "GAP"}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between font-mono text-[11px]">
                  <span>Controls: {matchedControls.length}</span>
                  <span>Avg Eff: {avgEff}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
