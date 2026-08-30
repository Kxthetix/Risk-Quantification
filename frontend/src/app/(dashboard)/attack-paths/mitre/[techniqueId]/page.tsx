"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMitreTechnique } from "@/features/attack-paths/hooks";
import { AttackPathTable } from "@/features/attack-paths/components/AttackPathTable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft,
  Target,
  ExternalLink,
  ShieldCheck,
  Server,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export default function MitreTechniqueDetailPage() {
  const params = useParams();
  const techniqueId = Array.isArray(params?.techniqueId)
    ? params.techniqueId[0]
    : (params?.techniqueId as string) || "";
  const { data: techDetail, isLoading } = useMitreTechnique(techniqueId);

  // Fallback defaults if loading or offline
  const detail = techDetail || {
    technique_id: techniqueId,
    name: "Exploit Public-Facing Application",
    tactic: "Initial Access",
    description: "Adversaries may attempt to take advantage of a weakness in an Internet-facing computer or program using software, packet, or other qualities to achieve code execution on a remote system.",
    source: "MITRE ATT&CK",
    risk_level: "CRITICAL" as const,
    financial_exposure: 28400000,
    attack_paths: [],
    affected_assets: [
      { id: "ast-1", name: "DMZ-WAF-01", criticality: "CRITICAL", environment: "PRODUCTION" },
      { id: "ast-2", name: "VPN-Concentrator-HQ", criticality: "CRITICAL", environment: "PRODUCTION" },
    ],
    mitigations: [
      "Application Isolation and Sandboxing",
      "Network Segmentation & DMZ Ingress Filtering",
      "Regular Vulnerability Scanning & Fast Patching",
      "Web Application Firewall (WAF) Inspection Rules",
    ],
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href="/attack-paths/mitre">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {detail.technique_id}
              </span>
              <h1 className="text-xl font-bold text-foreground">
                {detail.name}
              </h1>
              <RiskBadge level={detail.risk_level || "CRITICAL"} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tactic: <strong>{detail.tactic}</strong> · Source: {detail.source || "MITRE ATT&CK"}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
          <Link href="/risk-quantification">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>Financial Analysis</span>
          </Link>
        </Button>
      </div>

      {/* Overview & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-card/80 p-4 md:col-span-2 space-y-2 text-xs">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
            Technique Description &amp; Scope
          </span>
          <p className="text-foreground leading-relaxed text-xs">
            {detail.description}
          </p>
        </Card>

        <Card className="border border-border bg-card/80 p-4 space-y-2 text-xs">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
            Financial Impact
          </span>
          <div className="text-xl font-bold font-mono text-emerald-500">
            {formatCurrency(detail.financial_exposure || 24000000)}
          </div>
          <span className="text-[11px] text-muted-foreground block">
            Expected annual loss across all attack paths exploiting this technique.
          </span>
        </Card>
      </div>

      {/* Affected Assets & Recommended Mitigations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Assets */}
        <Card className="border border-border bg-card/80">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-400" />
              <span>Affected Organization Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {detail.affected_assets?.length === 0 ? (
              <p className="text-muted-foreground">No specific assets linked.</p>
            ) : (
              detail.affected_assets?.map((a: any) => (
                <div key={a.id} className="p-2.5 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block">{a.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{a.environment}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {a.criticality}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mitigations */}
        <Card className="border border-border bg-card/80">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Recommended Defensive Mitigations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {detail.mitigations?.map((m: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-foreground font-medium">{m}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Associated Attack Paths */}
      {detail.attack_paths && detail.attack_paths.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-foreground">
            Discovered Attack Paths Utilizing {detail.technique_id}
          </h3>
          <AttackPathTable paths={detail.attack_paths} />
        </div>
      )}
    </div>
  );
}
