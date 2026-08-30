"use client";

import React from "react";
import { useComplianceFrameworks, useCrossFrameworkMappings } from "@/features/compliance/hooks";
import { FrameworkComparisonView } from "@/features/compliance/components/FrameworkComparisonView";
import { CrossFrameworkMappingView } from "@/features/compliance/components/CrossFrameworkMappingView";
import { Layers } from "lucide-react";

export default function ComplianceComparePage() {
  const { data: frameworks, isLoading: isFrameworksLoading } = useComplianceFrameworks();
  const { data: mappings, isLoading: isMappingsLoading } = useCrossFrameworkMappings();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-cyan-400" />
          Framework Comparison & Harmonization
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Benchmark compliance frameworks side-by-side and map common controls
        </p>
      </div>

      <FrameworkComparisonView frameworks={frameworks} isLoading={isFrameworksLoading} />
      <CrossFrameworkMappingView mappings={mappings} isLoading={isMappingsLoading} />
    </div>
  );
}
