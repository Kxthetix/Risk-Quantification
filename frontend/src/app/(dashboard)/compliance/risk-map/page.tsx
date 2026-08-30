"use client";

import React from "react";
import { useComplianceCyberRiskMap } from "@/features/compliance/hooks";
import { ComplianceCyberRiskMap } from "@/features/compliance/components/ComplianceCyberRiskMap";
import { ComplianceRiskHeatmap } from "@/features/compliance/components/ComplianceRiskHeatmap";
import { GitFork } from "lucide-react";

export default function ComplianceRiskMapPage() {
  const { data: riskMap, isLoading } = useComplianceCyberRiskMap();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GitFork className="w-6 h-6 text-indigo-400" />
          Compliance-to-Cyber Risk Interactive Mapping
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Full traceability chain: Requirement → Security Control → Control Gap → CVE → Attack Path → Crown Jewel → Financial Exposure
        </p>
      </div>

      <ComplianceCyberRiskMap data={riskMap} isLoading={isLoading} />
      <ComplianceRiskHeatmap />
    </div>
  );
}
