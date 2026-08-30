"use client";

import React from "react";
import { useSOCDashboard, SOCActiveIncidents } from "@/features/soc";
import { Button } from "@/components/ui/button";
import { Flame, RefreshCw, Plus, Shield } from "lucide-react";
import Link from "next/link";

export default function SOCIncidentsPage() {
  const { data: dashboard, isLoading, refetch, isFetching } = useSOCDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-red-500" />
            Security Operations Incident Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Active security incidents classified by business risk, affected critical assets, and response phase.
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

          <Link href="/soc/cases">
            <Button size="sm" variant="outline" className="border-indigo-800 bg-indigo-950/40 text-indigo-300 text-xs h-9">
              Consolidated Cases
            </Button>
          </Link>
        </div>
      </div>

      <SOCActiveIncidents incidents={dashboard?.active_incidents} isLoading={isLoading} />
    </div>
  );
}
