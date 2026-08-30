"use client";

import React from "react";
import { useFrameworkControls, useCrossFrameworkMappings } from "@/features/compliance/hooks";
import { ControlsTable } from "@/features/compliance/components/ControlsTable";
import { CrossFrameworkMappingView } from "@/features/compliance/components/CrossFrameworkMappingView";
import { Layers } from "lucide-react";

export default function ControlLibraryPage() {
  const { data: controls, isLoading: isControlsLoading } = useFrameworkControls("iso-27001-2022");
  const { data: mappings, isLoading: isMappingsLoading } = useCrossFrameworkMappings();

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-cyan-400" />
          Enterprise Security Control Library
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete inventory of defensive technical and organizational controls with cross-framework mapping
        </p>
      </div>

      <ControlsTable controls={controls} isLoading={isControlsLoading} />
      <CrossFrameworkMappingView mappings={mappings} isLoading={isMappingsLoading} />
    </div>
  );
}
