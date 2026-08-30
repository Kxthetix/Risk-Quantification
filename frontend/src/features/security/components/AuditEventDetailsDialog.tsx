"use client";

import React from "react";
import { AuditLogEvent } from "../types";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, AlertTriangle, Terminal } from "lucide-react";

export interface AuditEventDetailsDialogProps {
  event: AuditLogEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditEventDetailsDialog({
  event,
  open,
  onOpenChange,
}: AuditEventDetailsDialogProps) {
  if (!event) return null;

  const isSuccess = event.status === "SUCCESS";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  isSuccess
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                }`}
              >
                {isSuccess ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              </div>
              <div>
                <DialogTitle className="text-base font-mono">{event.action}</DialogTitle>
                <DialogDescription className="text-xs">
                  {formatDateTime(event.created_at)}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${
                isSuccess
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              {event.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor Email</span>
              <span className="font-semibold text-foreground truncate block">
                {event.user_email || "System Service"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Actor User ID</span>
              <span className="font-mono text-muted-foreground truncate block">
                {event.user_id || "SYSTEM"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Resource Target</span>
              <span className="font-semibold text-foreground">
                {event.resource_type || "N/A"}{" "}
                {event.resource_id && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    ({event.resource_id})
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Client IP Address</span>
              <span className="font-mono text-foreground">{event.ip_address || "127.0.0.1"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-[11px]">Request Tracing ID</span>
              <span className="font-mono text-[11px] text-primary truncate block">
                {event.request_id || "req-direct-api"}
              </span>
            </div>
          </div>

          {/* Structured Payload / Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                <span>Event Context & Payload</span>
              </div>
              <pre className="p-3 rounded-lg border border-border bg-black/80 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
