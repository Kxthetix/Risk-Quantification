"use client";

import React from "react";
import { ExecutionsTable, useResponseExecutions } from "@/features/response-executions";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, BookOpen } from "lucide-react";
import Link from "next/link";

export default function ResponseExecutionsPage() {
  const { data: executions = [], isLoading, refetch, isFetching } = useResponseExecutions();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Play className="w-7 h-7 text-indigo-400" />
            Response Executions & Orchestration Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit log and real-time execution monitor of automated containment playbooks, forensic collection, and rollback logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Link href="/soc/playbooks">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Playbook Catalog
            </Button>
          </Link>
        </div>
      </div>

      <ExecutionsTable executions={executions} isLoading={isLoading} />
    </div>
  );
}
