"use client";

import React from "react";
import { useComplianceRemediations } from "@/features/compliance/hooks";
import { ComplianceRemediationTable } from "@/features/compliance/components/ComplianceRemediationTable";
import { Wrench } from "lucide-react";

export default function ComplianceRemediationPage() {
  const { data: remediations, isLoading } = useComplianceRemediations();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wrench className="w-6 h-6 text-emerald-400" />
          Compliance Remediation Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Prioritized corrective actions and quantifiable risk reduction tracking
        </p>
      </div>

      <ComplianceRemediationTable remediations={remediations} isLoading={isLoading} />
    </div>
  );
}
