"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportSchedulesPanel } from "@/features/reports/components/ReportSchedules";

export default function ReportSchedulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Schedules"
        description="Configure automated recurring reports to keep stakeholders updated on cybersecurity risk posture."
        breadcrumbs={[{ label: "Reporting" }, { label: "Schedules" }]}
      />

      <ReportSchedulesPanel />
    </div>
  );
}
