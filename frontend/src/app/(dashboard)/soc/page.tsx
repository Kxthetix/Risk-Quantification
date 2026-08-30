"use client";

import React from "react";
import {
  SOCDashboardCards,
  SOCActiveIncidents,
  SOCTimelineView,
  useSOCDashboard,
} from "@/features/soc";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, BookOpen, Flame, CheckSquare } from "lucide-react";
import Link from "next/link";

export default function SOCDashboardPage() {
  const { data: dashboard, isLoading, refetch, isFetching } = useSOCDashboard();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-red-500" />
            Security Operations Center (SOC) Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time security signal correlation, incident triage, high-risk approval gates, and automated SOAR response workflows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

          <Link href="/soc/approvals">
            <Button size="sm" variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-300 text-xs h-9">
              <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Approvals Queue ({dashboard?.pending_approvals || 0})
            </Button>
          </Link>

          <Link href="/soc/playbooks">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9">
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              SOAR Playbooks
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Executive Cards */}
      <SOCDashboardCards dashboard={dashboard} isLoading={isLoading} />

      {/* Active Incidents & Real-Time Operational Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SOCActiveIncidents incidents={dashboard?.active_incidents} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <SOCTimelineView timeline={dashboard?.recent_timeline} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
