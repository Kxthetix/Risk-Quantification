"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ExecutionTimelineView,
  useResponseExecutionDetail,
} from "@/features/response-executions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";

export default function ExecutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const executionId = params.executionId as string;
  const { data: execution, isLoading, refetch, isFetching } = useResponseExecutionDetail(executionId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/soc/executions")}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Executions
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" />
              Execution Trace: {executionId}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Playbook: <span className="text-slate-200">{execution?.playbook_name}</span>
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

      {isLoading || !execution ? (
        <div className="py-12 text-center text-slate-500">Loading execution telemetry...</div>
      ) : (
        <ExecutionTimelineView execution={execution} />
      )}
    </div>
  );
}
