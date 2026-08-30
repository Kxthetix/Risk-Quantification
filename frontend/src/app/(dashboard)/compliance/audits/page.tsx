"use client";

import React from "react";
import { useComplianceAudits } from "@/features/compliance/hooks";
import { AuditsTable } from "@/features/compliance/components/AuditsTable";
import { Award } from "lucide-react";

export default function ComplianceAuditsPage() {
  const { data: audits, isLoading } = useComplianceAudits();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-emerald-400" />
          Audits & Certification Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Historical and active internal & external certification audits and findings
        </p>
      </div>

      <AuditsTable audits={audits} isLoading={isLoading} />
    </div>
  );
}
