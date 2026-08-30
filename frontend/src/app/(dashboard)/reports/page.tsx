"use client";

import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/tables/DataTable";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { Plus, Download, FileText } from "lucide-react";
import { Report } from "@/types/report";
import { formatDate } from "@/lib/utils/date";

const MOCK_REPORTS: Report[] = [
  {
    id: "rep-1",
    organization_id: "org-1",
    title: "Executive Board Cybersecurity Posture & Financial Impact Report",
    report_type: "EXECUTIVE_RISK",
    format: "PDF",
    status: "COMPLETED",
    file_size_bytes: 2450000,
    created_at: new Date().toISOString(),
  },
  {
    id: "rep-2",
    organization_id: "org-1",
    title: "Quarterly Attack Surface & Vulnerability Remediation Ledger",
    report_type: "VULNERABILITY",
    format: "CSV",
    status: "COMPLETED",
    file_size_bytes: 380000,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default function ReportsPage() {
  const columns = [
    {
      id: "title",
      header: "Report Title & Type",
      cell: ({ row }: { row: Report }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.title}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.report_type}</span>
        </div>
      ),
    },
    {
      id: "format",
      header: "Format",
      cell: ({ row }: { row: Report }) => (
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono font-bold text-foreground">
          {row.format}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }: { row: Report }) => <StatusBadge status={row.status} />,
    },
    {
      id: "date",
      header: "Generated Date",
      cell: ({ row }: { row: Report }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.created_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: Report }) => (
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary">
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive & Technical Reports"
        description="Board-ready PDF summaries, compliance ledgers, CSV raw export datasets, and financial risk models."
        breadcrumbs={[{ label: "Reporting" }, { label: "Reports" }]}
        actions={
          <Can permission="reports:create">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </Can>
        }
      />

      <DataTable columns={columns} data={MOCK_REPORTS} />
    </div>
  );
}
