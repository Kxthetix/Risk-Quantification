"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportHistoryTable } from "@/features/reports/components/ReportHistory";

export default function ReportHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report History"
        description="Audit trail and download registry of all generated cybersecurity risk, compliance, and asset ledgers."
        breadcrumbs={[{ label: "Reporting" }, { label: "History" }]}
      />

      <ReportHistoryTable />
    </div>
  );
}
