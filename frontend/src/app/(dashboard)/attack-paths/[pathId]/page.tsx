"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAttackPath } from "@/features/attack-paths/hooks";
import { AttackStepTimeline } from "@/features/attack-paths/components/AttackStepTimeline";
import { AttackPathGraph } from "@/features/attack-paths/components/AttackPathGraph";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Target,
  Server,
  Bug,
  TrendingUp,
  Clock,
  ShieldCheck,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function AttackPathDetailPage() {
  const params = useParams();
  const pathId = Array.isArray(params?.pathId) ? params.pathId[0] : (params?.pathId as string) || "";
  const { data: path, isLoading } = useAttackPath(pathId);

  // Fallback demo detail if not found in db
  const defaultPath = {
    id: pathId,
    source_node: "Internet Gateway",
    target_node: "Primary Payment DB",
    target_asset_name: "Primary Production Payment DB",
    business_service_name: "Transaction Processing",
    path_score: 94.2,
    likelihood: 0.88,
    impact: 0.95,
    confidence: 0.92,
    path_length: 4,
    status: "ACTIVE" as const,
    is_blocked: false,
    financial_exposure: 28500000,
    created_at: new Date().toISOString(),
    nodes: [
      { id: "n1", node_type: "ENTRY_POINT", label: "External Internet / WAF", sequence: 0, score: 90 },
      { id: "n2", node_type: "APPLICATION", label: "Payment API Server (CVE-2024-3094)", sequence: 1, score: 92, technique: { technique_id: "T1190", name: "Exploit Public-Facing App", tactic: "Initial Access" } },
      { id: "n3", node_type: "IDENTITY", label: "Domain Admin Credential Dumping", sequence: 2, score: 94, technique: { technique_id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access" } },
      { id: "n4", node_type: "DATABASE", label: "Primary Payment Database", sequence: 3, score: 96, technique: { technique_id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2", type: "NETWORK_REACHABILITY", probability: 0.95, confidence: 0.9, is_blocked: false },
      { id: "e2", source: "n2", target: "n3", type: "EXPLOITATION", probability: 0.85, confidence: 0.88, is_blocked: false },
      { id: "e3", source: "n3", target: "n4", type: "PRIVILEGE_ESCALATION", probability: 0.90, confidence: 0.92, is_blocked: false },
    ],
  };

  const activePath = path || defaultPath;

  const graphData = {
    nodes: (activePath.nodes || []).map((n) => ({
      id: n.id,
      label: n.label || "Node",
      type: n.node_type,
      risk_score: n.score,
      is_entry_point: n.sequence === 0,
    })),
    edges: (activePath.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source || e.source_node_id || "n1",
      target: e.target || e.destination_node_id || "n2",
      type: e.type || e.edge_type || "NETWORK_REACHABILITY",
      probability: e.probability ?? 0.8,
      confidence: e.confidence ?? 0.85,
      is_blocked: e.is_blocked ?? false,
      blocking_reason: e.blocking_reason,
    })),
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href="/attack-paths">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                Attack Path: {activePath.source_node} → {activePath.target_node}
              </h1>
              <RiskBadge level={activePath.path_score >= 80 ? "CRITICAL" : "HIGH"} />
              <StatusBadge status={activePath.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Path ID: <span className="font-mono">{pathId}</span> · Target: <strong>{activePath.target_asset_name || activePath.target_node}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/risk-quantification">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>View Financial Loss Model</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Key Path Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Composite Risk Score</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {activePath.path_score} / 100
          </div>
          <span className="text-[10px] text-rose-400 font-semibold">Critical Threat Vector</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Modeled Loss Exposure</span>
          <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
            {formatCurrency(activePath.financial_exposure)}
          </div>
          <span className="text-[10px] text-muted-foreground">Expected Annual Loss (ALE)</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Traversal Depth</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {activePath.path_length} hops
          </div>
          <span className="text-[10px] text-muted-foreground">From Perimeter to DB</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Likelihood &amp; Confidence</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {Math.round(activePath.likelihood * 100)}%
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {Math.round(activePath.confidence * 100)}% confidence
          </span>
        </Card>
      </div>

      {/* 3. Focused Graph Visualization */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">
          Attack Path Traversal Graph
        </h3>
        <AttackPathGraph data={graphData} height={380} />
      </div>

      {/* 4. Attack Steps Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Step-by-Step Adversary Sequence
          </h3>
          <AttackStepTimeline nodes={activePath.nodes || []} />
        </div>

        {/* 5. Recommended Mitigations Panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            High-Leverage Remediation
          </h3>
          <Card className="border border-border bg-card/80 p-4 space-y-3 text-xs">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              Breaking this path reduces financial risk by {formatCurrency(activePath.financial_exposure * 0.75)}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">1. Patch Edge Vulnerability</span>
                  <p className="text-[11px] text-muted-foreground">Apply patch on VPN/WAF gateway to close initial perimeter access.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">2. Enforce PAM &amp; MFA</span>
                  <p className="text-[11px] text-muted-foreground">Restrict domain administrator credential usage to dedicated bastions.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground block">3. Subnet Microsegmentation</span>
                  <p className="text-[11px] text-muted-foreground">Deny lateral TCP/3306 traffic from untrusted application subnets.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
