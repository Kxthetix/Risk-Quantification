"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useComplianceGapDetail } from "@/features/compliance/hooks";
import { ComplianceGapDetail } from "@/features/compliance/components/ComplianceGapDetail";
import { ArrowLeft } from "lucide-react";

export default function ComplianceGapDetailPage() {
  const params = useParams();
  const gapId = (params?.gapId as string) || "gap-01";

  const { data: gap, isLoading } = useComplianceGapDetail(gapId);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link
          href="/compliance/gaps"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gaps Inventory
        </Link>
      </div>

      <ComplianceGapDetail gap={gap} isLoading={isLoading} />
    </div>
  );
}
