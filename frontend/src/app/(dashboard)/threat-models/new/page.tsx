"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThreatScenarioForm } from "@/features/attack-paths/components/ThreatScenarioForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewThreatScenarioPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
          <Link href="/threat-models">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Create Adversary Threat Scenario
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure custom attacker profiles, entry vectors, and business impact targets.
          </p>
        </div>
      </div>

      <ThreatScenarioForm
        onSuccess={() => {
          router.push("/threat-models");
        }}
      />
    </div>
  );
}
