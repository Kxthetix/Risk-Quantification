"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { CaseDetailWorkspace, useCaseDetail } from "@/features/cases";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Briefcase, RefreshCw } from "lucide-react";

export default function CaseWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;
  const { data: caseItem, isLoading, refetch, isFetching } = useCaseDetail(caseId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/soc/cases")}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Cases
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              {caseItem ? `${caseItem.case_number}: ${caseItem.title}` : "Case Workspace"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Lead: <span className="text-slate-200">{caseItem?.lead_investigator}</span>
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading || !caseItem ? (
        <div className="py-12 text-center text-slate-500">Loading case workspace...</div>
      ) : (
        <CaseDetailWorkspace caseItem={caseItem} />
      )}
    </div>
  );
}
