"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IncidentTriageModal } from "@/features/soc";
import { ArrowLeft, UserCheck } from "lucide-react";

export default function IncidentTriagePage() {
  const params = useParams();
  const router = useRouter();
  const incidentId = params.incidentId as string;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.back()}
          className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-400" />
          Incident Triage: {incidentId}
        </h1>
      </div>

      <IncidentTriageModal
        incidentId={incidentId}
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push(`/soc/incidents`);
        }}
      />
    </div>
  );
}
