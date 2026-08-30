"use client";

import React from "react";
import { useComplianceGaps } from "@/features/compliance/hooks";
import { ComplianceGapsTable } from "@/features/compliance/components/ComplianceGapsTable";
import { AlertOctagon } from "lucide-react";

export default function ComplianceGapsPage() {
  const { data: gaps, isLoading } = useComplianceGaps();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-rose-400" />
          Compliance Gaps Inventory
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Identified control deficiencies with multi-hop attack path linkage and financial exposure
        </p>
      </div>

      <ComplianceGapsTable gaps={gaps} isLoading={isLoading} />
    </div>
  );
}
