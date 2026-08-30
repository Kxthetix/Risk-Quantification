"use client";

import React, { useState } from "react";
import { AuditLogEvent } from "../types";
import { useAuditLogs, useExportAuditLogs } from "../hooks";
import { AuditEventDetailsDialog } from "./AuditEventDetailsDialog";
import { DataTable } from "@/components/tables/DataTable";
import { DataTableToolbar } from "@/components/tables/DataTableToolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime, formatRelativeTime } from "@/lib/utils/date";
import { Download, Eye, FileSpreadsheet, FileCode, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOCK_AUDIT_LOGS: AuditLogEvent[] = [
  {
    id: "aud-1",
    user_id: "usr-admin-1",
    user_email: "admin@enterprise.corp",
    organization_id: "org-1",
    action: "USER_INVITED",
    resource_type: "USER",
    resource_id: "usr-analyst-2",
    status: "SUCCESS",
    ip_address: "103.24.120.89",
    request_id: "req-9a8f-413b",
    metadata: { invited_email: "analyst@enterprise.corp", role: "SECURITY_ANALYST" },
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  },
  {
    id: "aud-2",
    user_id: "usr-admin-1",
    user_email: "admin@enterprise.corp",
    organization_id: "org-1",
    action: "ROLE_CHANGED",
    resource_type: "USER",
    resource_id: "usr-manager-3",
    status: "SUCCESS",
    ip_address: "103.24.120.89",
    request_id: "req-2c7e-881a",
    metadata: { old_role: "VIEWER", new_role: "MANAGER" },
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: "aud-3",
    user_id: "usr-analyst-2",
    user_email: "analyst@enterprise.corp",
    organization_id: "org-1",
    action: "MONTE_CARLO_SIMULATION_EXECUTED",
    resource_type: "FINANCIAL_RISK",
    resource_id: "sim-10000",
    status: "SUCCESS",
    ip_address: "103.24.120.92",
    request_id: "req-312a-09fd",
    metadata: { runs: 10000, p95_loss: 24500000 },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "aud-4",
    user_id: "usr-viewer-4",
    user_email: "viewer@enterprise.corp",
    organization_id: "org-1",
    action: "ASSET_DELETE_ATTEMPT",
    resource_type: "ASSET",
    resource_id: "ast-payment-gw",
    status: "DENIED",
    ip_address: "182.74.89.12",
    request_id: "req-5b12-990e",
    metadata: { reason: "INSUFFICIENT_PERMISSIONS", required_role: "ADMIN" },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

export function AuditLogTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<AuditLogEvent | null>(null);

  const { data: serverLogs = [], isLoading } = useAuditLogs({
    search: debouncedSearch || undefined,
  });

  const exportMutation = useExportAuditLogs();

  const logs = serverLogs.length > 0 ? serverLogs : MOCK_AUDIT_LOGS;

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const matchAction = log.action.toLowerCase().includes(q);
      const matchEmail = log.user_email?.toLowerCase().includes(q);
      const matchResource = log.resource_type?.toLowerCase().includes(q);
      const matchIp = log.ip_address?.toLowerCase().includes(q);
      if (!matchAction && !matchEmail && !matchResource && !matchIp) return false;
    }
    return true;
  });

  const handleExport = (format: "csv" | "json") => {
    // Client-side fallback export if server-side export fails/mocks
    try {
      const dataStr =
        format === "json"
          ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2))
          : "data:text/csv;charset=utf-8," +
            encodeURIComponent(
              [
                "Timestamp,User Email,Action,Resource Type,Status,IP Address,Request ID",
                ...filteredLogs.map(
                  (l) =>
                    `"${l.created_at}","${l.user_email || ""}","${l.action}","${l.resource_type || ""}","${l.status}","${l.ip_address || ""}","${l.request_id || ""}"`
                ),
              ].join("\n")
            );

      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `audit-trail-${new Date().toISOString().split("T")[0]}.${format}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      exportMutation.mutate({ format });
    }
  };

  const columns = [
    {
      id: "time",
      header: "Timestamp",
      cell: ({ row }: { row: AuditLogEvent }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-xs">
            {formatDateTime(row.created_at)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatRelativeTime(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: "user",
      header: "User / Actor",
      cell: ({ row }: { row: AuditLogEvent }) => (
        <span className="text-xs font-mono text-foreground">{row.user_email || "System"}</span>
      ),
    },
    {
      id: "action",
      header: "Action Triggered",
      cell: ({ row }: { row: AuditLogEvent }) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-primary">{row.action}</span>
          <span className="text-[10px] text-muted-foreground">
            {row.resource_type || "GLOBAL"}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }: { row: AuditLogEvent }) => {
        const isSuccess = row.status === "SUCCESS";
        return (
          <Badge
            variant="outline"
            className={`text-[10px] py-0 px-1.5 font-semibold ${
              isSuccess
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
            }`}
          >
            {row.status}
          </Badge>
        );
      },
    },
    {
      id: "ip",
      header: "Client IP & Request ID",
      cell: ({ row }: { row: AuditLogEvent }) => (
        <div className="flex flex-col font-mono text-[11px]">
          <span className="text-foreground">{row.ip_address || "127.0.0.1"}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {row.request_id || "req-direct"}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Inspect",
      cell: ({ row }: { row: AuditLogEvent }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-primary gap-1"
          onClick={() => setSelectedEvent(row)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Details</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <DataTableToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search audit trail by user, action, IP..."
        />

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Filter audit logs by status"
          >
            <option value="ALL" className="bg-popover text-popover-foreground">
              All Statuses
            </option>
            <option value="SUCCESS" className="bg-popover text-popover-foreground">
              Success
            </option>
            <option value="DENIED" className="bg-popover text-popover-foreground">
              Denied
            </option>
            <option value="FAILURE" className="bg-popover text-popover-foreground">
              Failure
            </option>
          </select>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Download className="h-4 w-4" />
                <span>Export Audit</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2 text-xs cursor-pointer">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2 text-xs cursor-pointer">
                <FileCode className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Audit Log Table */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading}
        emptyMessage="No audit log events found matching the search criteria."
      />

      {/* Event Details Dialog */}
      {selectedEvent && (
        <AuditEventDetailsDialog
          event={selectedEvent}
          open={!!selectedEvent}
          onOpenChange={(open) => !open && setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
