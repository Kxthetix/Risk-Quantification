"use client";

import React from "react";
import Link from "next/link";
import { RiskAppetiteCard } from "@/features/risk-quantification/components/RiskAppetiteCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Scale, ShieldCheck, AlertTriangle } from "lucide-react";

export default function RiskAppetitePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/risk-quantification"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Board Risk Appetite &amp; Tolerance</h1>
          <p className="text-xs text-muted-foreground">
            Configure executive risk appetite thresholds and track compliance with board-approved exposure limits.
          </p>
        </div>
      </div>

      <RiskAppetiteCard />

      <Card className="border-border bg-card text-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Governance &amp; Escalation Policy</CardTitle>
          <CardDescription className="text-xs">
            Standard operating procedure when simulated risk exceeds tolerance caps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground leading-relaxed">
          <p>
            1. <strong>Breach Notification:</strong> An automatic notification is dispatched to the Chief Information Security Officer (CISO) and Risk Committee.
          </p>
          <p>
            2. <strong>Remediation Acceleration:</strong> High-ROSI security controls must be prioritized in the treatment queue to reduce residual loss within 30 days.
          </p>
          <p>
            3. <strong>Board Exception Review:</strong> Residual risk remaining above threshold requires formal board sign-off and risk acceptance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
