"use client";

import React from "react";
import { ComplianceCalendarView } from "@/features/compliance/components/ComplianceCalendarView";
import { Calendar } from "lucide-react";

export default function ComplianceCalendarPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-400" />
          Compliance Deadlines & Audit Schedule
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Calendar view of upcoming assessments, certificate expirations, and audit dates
        </p>
      </div>

      <ComplianceCalendarView />
    </div>
  );
}
