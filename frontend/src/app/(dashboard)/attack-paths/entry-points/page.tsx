"use client";

import React from "react";
import Link from "next/link";
import { useEntryPoints } from "@/features/attack-paths/hooks";
import { EntryPointsTable } from "@/features/attack-paths/components/EntryPointsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, RefreshCw } from "lucide-react";

export default function EntryPointsPage() {
  const { data, isLoading, refetch } = useEntryPoints();

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0 -ml-1">
              <Link href="/attack-paths">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              Exposed Perimeter &amp; Entry Point Analysis
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify internet-facing interfaces, VPN gateways, APIs, and cloud buckets enabling initial access.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <EntryPointsTable entryPoints={data} isLoading={isLoading} />
    </div>
  );
}
