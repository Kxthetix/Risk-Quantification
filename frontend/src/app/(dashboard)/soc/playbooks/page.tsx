"use client";

import React, { useState } from "react";
import {
  PlaybooksTable,
  PlaybookWorkflowBuilder,
  usePlaybooks,
} from "@/features/playbooks";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, RefreshCw, Workflow } from "lucide-react";

export default function PlaybooksPage() {
  const { data: playbooks = [], isLoading, refetch, isFetching } = usePlaybooks();
  const [showBuilder, setShowBuilder] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            SOAR Response Playbooks & Orchestration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Authoritative automated remediation workflows, pre-flight dry-run simulations, and containment playbooks.
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

          <Button
            size="sm"
            onClick={() => setShowBuilder(!showBuilder)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9"
          >
            {showBuilder ? (
              "Hide Designer"
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Build Playbook
              </>
            )}
          </Button>
        </div>
      </div>

      {showBuilder && <PlaybookWorkflowBuilder />}

      <PlaybooksTable playbooks={playbooks} isLoading={isLoading} />
    </div>
  );
}
