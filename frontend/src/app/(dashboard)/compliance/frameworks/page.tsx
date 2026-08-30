"use client";

import React from "react";
import { useComplianceFrameworks } from "@/features/compliance/hooks";
import { FrameworksTable } from "@/features/compliance/components/FrameworksTable";
import { FrameworkComparisonView } from "@/features/compliance/components/FrameworkComparisonView";
import { ShieldCheck } from "lucide-react";

export default function ComplianceFrameworksPage() {
  const { data: frameworks, isLoading } = useComplianceFrameworks();

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Frameworks Management</h1>
          <p className="text-xs text-slate-400">
            Catalog of active frameworks, standards, and regulatory requirements
          </p>
        </div>
      </div>

      <FrameworksTable frameworks={frameworks} isLoading={isLoading} />
      <FrameworkComparisonView frameworks={frameworks} isLoading={isLoading} />
    </div>
  );
}
