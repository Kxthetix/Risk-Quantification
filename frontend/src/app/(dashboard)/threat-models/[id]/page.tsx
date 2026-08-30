"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useThreatScenario, useThreatScenarioCompare } from "@/features/attack-paths/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";
import {
  ArrowLeft,
  ShieldAlert,
  Server,
  TrendingUp,
  GitCompare,
  ExternalLink,
  Target,
  Flame,
} from "lucide-react";

export default function ThreatScenarioDetailPage() {
  const params = useParams();
  const scenarioId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "";
  const { data: scenario, isLoading } = useThreatScenario(scenarioId);

  // Fallback demo scenario if loading / mock
  const activeScenario = scenario || {
    id: scenarioId,
    name: "Ransomware Extortion via Exposed VPN Gateway",
    attacker_profile: "RANSOMWARE_ACTOR" as const,
    objective: "Financial Extortion & Database Encryption",
    entry_point: "VPN Gateway (CVE-2024-3094)",
    target_asset_name: "Primary Production Payment DB",
    probability: 0.72,
    confidence: 0.88,
    risk_score: 91.5,
    status: "ACTIVE",
    description: "External ransomware syndicate initiates unauthenticated RCE against edge VPN concentrator, dumps memory credentials to gain Domain Admin, traverses to primary SQL cluster, and deploys simultaneous encryption and extortion lockers.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
            <Link href="/threat-models">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {activeScenario.name}
              </h1>
              <RiskBadge level={activeScenario.risk_score >= 80 ? "CRITICAL" : "HIGH"} />
              <StatusBadge status={activeScenario.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Profile: <span className="font-mono text-purple-400 font-semibold">{activeScenario.attacker_profile}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/threat-models/compare">
              <GitCompare className="h-3.5 w-3.5 text-amber-400" />
              <span>Compare Scenarios</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs h-8 gap-1.5">
            <Link href="/risk-quantification">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Financial Loss Model</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Risk Score</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {activeScenario.risk_score} / 100
          </div>
          <span className="text-[10px] text-rose-400 font-semibold">Critical Threat</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Likelihood</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {Math.round(activeScenario.probability * 100)}%
          </div>
          <span className="text-[10px] text-muted-foreground">Adversary Opportunity</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Confidence</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {Math.round(activeScenario.confidence * 100)}%
          </div>
          <span className="text-[10px] text-muted-foreground">Graph Synthesis</span>
        </Card>

        <Card className="border border-border bg-card/70 p-3.5">
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">Financial Exposure</span>
          <div className="text-xl font-bold font-mono text-emerald-500 mt-1">
            {formatCurrency(24500000)}
          </div>
          <span className="text-[10px] text-muted-foreground">Expected Annual Loss</span>
        </Card>
      </div>

      {/* Scenario Anatomy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <Card className="border border-border bg-card/80 p-4 space-y-3">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
            Hypothetical Kill-Chain Description
          </span>
          <p className="text-foreground leading-relaxed">
            {activeScenario.description}
          </p>

          <div className="pt-2 border-t border-border space-y-2">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Entry Point:</span>
              <span className="font-mono text-amber-400 font-semibold">{activeScenario.entry_point}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Target Crown Jewel:</span>
              <span className="font-semibold text-foreground">{activeScenario.target_asset_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Objective:</span>
              <span className="text-foreground">{activeScenario.objective}</span>
            </div>
          </div>
        </Card>

        <Card className="border border-border bg-card/80 p-4 space-y-3">
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">
            Associated Attack Path Linkage
          </span>
          <p className="text-muted-foreground">
            This scenario maps directly to Discovered Path #1 (Internet Gateway → VPN → Domain Admin → Payment DB).
          </p>

          <div className="pt-2 border-t border-border">
            <Button size="sm" asChild className="w-full text-xs gap-1.5">
              <Link href="/attack-paths">
                <Target className="h-3.5 w-3.5" />
                <span>Inspect in Attack Graph</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
