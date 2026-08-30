"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useFrameworkControls, useFrameworkDetail } from "@/features/compliance/hooks";
import { ControlsTable } from "@/features/compliance/components/ControlsTable";
import { ArrowLeft, Layers } from "lucide-react";

export default function FrameworkControlsViewPage() {
  const params = useParams();
  const frameworkId = (params?.frameworkId as string) || "iso-27001-2022";

  const { data: framework } = useFrameworkDetail(frameworkId);
  const { data: controls, isLoading } = useFrameworkControls(frameworkId);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          href={`/compliance/frameworks/${frameworkId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Framework Overview
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-400" />
          {framework?.name || "Framework"} Controls
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed control requirements, implementation effectiveness, and associated attack path exposure
        </p>
      </div>

      <ControlsTable controls={controls} isLoading={isLoading} />
    </div>
  );
}
