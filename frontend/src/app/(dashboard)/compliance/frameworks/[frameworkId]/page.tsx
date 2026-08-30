"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFrameworkDetail, useFrameworkControls } from "@/features/compliance/hooks";
import { FrameworkDetailCard } from "@/features/compliance/components/FrameworkDetailCard";
import { Iso27001ClauseView } from "@/features/compliance/components/Iso27001ClauseView";
import { ControlsTable } from "@/features/compliance/components/ControlsTable";
import { ArrowLeft, Layers } from "lucide-react";

export default function FrameworkDetailPage() {
  const params = useParams();
  const frameworkId = (params?.frameworkId as string) || "iso-27001-2022";

  const { data: framework, isLoading: isFrameworkLoading } = useFrameworkDetail(frameworkId);
  const { data: controls, isLoading: isControlsLoading } = useFrameworkControls(frameworkId);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href="/compliance/frameworks"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Frameworks
        </Link>
        <Link
          href={`/compliance/frameworks/${frameworkId}/controls`}
          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Layers className="w-4 h-4" />
          View All Controls ({framework?.total_controls || 0})
        </Link>
      </div>

      <FrameworkDetailCard framework={framework} isLoading={isFrameworkLoading} />

      {framework?.clauses && <Iso27001ClauseView clauses={framework.clauses} />}

      <ControlsTable controls={controls} isLoading={isControlsLoading} />
    </div>
  );
}
