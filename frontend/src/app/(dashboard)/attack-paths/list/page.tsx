"use client";

import React from "react";
import Link from "next/link";
import { useAttackPaths } from "@/features/attack-paths/hooks";
import { AttackPathTable } from "@/features/attack-paths/components/AttackPathTable";
import { AnalysisPanel } from "@/features/attack-paths/components/AnalysisPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Network } from "lucide-react";

export default function AttackPathListPage() {
  const { data, isLoading, refetch } = useAttackPaths({ limit: 100 });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/attack-paths">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Attack Path Directory
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete inventory of realistic adversarial lateral movement routes and target vulnerabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
          <AnalysisPanel onAnalysisCompleted={() => refetch()} />
        </div>
      </div>

      {/* Full List Table */}
      <AttackPathTable paths={data?.paths} isLoading={isLoading} />
    </div>
  );
}
