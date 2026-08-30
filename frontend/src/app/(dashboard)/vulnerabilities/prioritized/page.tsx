"use client";

import React from "react";
import Link from "next/link";
import { VulnerabilityPriorityMatrix } from "@/features/vulnerabilities/components/VulnerabilityPriorityMatrix";
import { VulnerabilityFinancialMatrix } from "@/features/vulnerabilities/components/VulnerabilityFinancialMatrix";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, ShieldAlert, DollarSign } from "lucide-react";

export default function PrioritizedVulnerabilitiesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/vulnerabilities"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Vulnerability Prioritization Analytics</h1>
          <p className="text-xs text-muted-foreground">
            Multi-dimensional decision matrices evaluating technical CVSS, asset criticality, attack paths, and Expected Annual Loss (ALE).
          </p>
        </div>
      </div>

      {/* 1. CVSS vs Business Cyber Risk */}
      <VulnerabilityPriorityMatrix />

      {/* 2. Business Cyber Risk vs Expected Financial Loss */}
      <VulnerabilityFinancialMatrix />
    </div>
  );
}
