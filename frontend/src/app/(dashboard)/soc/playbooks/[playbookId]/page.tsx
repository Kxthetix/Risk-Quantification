"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PlaybookDetailView,
  PlaybookDryRunModal,
  usePlaybookDetail,
} from "@/features/playbooks";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, RefreshCw, BookOpen } from "lucide-react";

export default function PlaybookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playbookId = params.playbookId as string;
  const { data: playbook, isLoading, refetch, isFetching } = usePlaybookDetail(playbookId);
  const [dryRunOpen, setDryRunOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/soc/playbooks")}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-8"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Playbooks
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              {playbook ? playbook.name : "Playbook Blueprint"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{playbook?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

          <Button
            size="sm"
            onClick={() => setDryRunOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            Simulate Dry Run
          </Button>
        </div>
      </div>

      {isLoading || !playbook ? (
        <div className="py-12 text-center text-slate-500">Loading playbook details...</div>
      ) : (
        <PlaybookDetailView playbook={playbook} />
      )}

      {dryRunOpen && (
        <PlaybookDryRunModal
          playbookId={playbookId}
          open={dryRunOpen}
          onOpenChange={setDryRunOpen}
        />
      )}
    </div>
  );
}
