"use client";

import React from "react";
import Link from "next/link";
import { ThreatScenarioCompare } from "@/features/attack-paths/components/ThreatScenarioCompare";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitCompare, Sparkles } from "lucide-react";

export default function ThreatScenarioComparePage() {
  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/threat-models">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Comparative Threat Scenario Matrix
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Side-by-side risk, loss distribution, and likelihood metrics across modeled adversary profiles.
          </p>
        </div>
      </div>

      <ThreatScenarioCompare />
    </div>
  );
}
