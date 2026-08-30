"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useControlDetail } from "@/features/compliance/hooks";
import { ControlDetailView } from "@/features/compliance/components/ControlDetailView";
import { ArrowLeft } from "lucide-react";

export default function ControlDetailPage() {
  const params = useParams();
  const controlId = (params?.controlId as string) || "ctrl-a8-20";

  const { data: control, isLoading } = useControlDetail(controlId);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link
          href="/compliance/control-library"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Control Library
        </Link>
      </div>

      <ControlDetailView control={control} isLoading={isLoading} />
    </div>
  );
}
