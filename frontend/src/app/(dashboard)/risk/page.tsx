"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/badge";
import { Can } from "@/components/auth/Can";
import { Shield, RefreshCw, Layers } from "lucide-react";

export default function RiskPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cyber Risk Posture"
        description="Dynamic algorithmic contextual risk scoring computed from asset criticality, vulnerability exploitability, and network exposure."
        breadcrumbs={[{ label: "Risk" }, { label: "Risk Posture" }]}
        badge={<RiskBadge level="HIGH" />}
        actions={
          <Can permission="risk:recalculate">
            <Button size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Recalculate Scores</span>
            </Button>
          </Can>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-border bg-card/80 p-6 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-extrabold text-foreground mb-1">78.4</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Aggregated Risk Score
          </p>
          <div className="mt-3">
            <RiskBadge level="HIGH" />
          </div>
        </Card>

        <Card className="border-border bg-card/80 p-6 md:col-span-3">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Risk Tier Distribution
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-500">24</div>
              <div className="text-xs text-muted-foreground mt-1">Low (0-39)</div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">18</div>
              <div className="text-xs text-muted-foreground mt-1">Medium (40-69)</div>
            </div>
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">9</div>
              <div className="text-xs text-muted-foreground mt-1">High (70-89)</div>
            </div>
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-center">
              <div className="text-2xl font-bold text-rose-500">3</div>
              <div className="text-xs text-muted-foreground mt-1">Critical (90-100)</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
