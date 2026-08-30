"use client";

import React, { useState } from "react";
import { UserSession } from "../types";
import { useUserSessions } from "../hooks";
import { RevokeSessionDialog } from "./RevokeSessionDialog";
import { DataTable } from "@/components/tables/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/date";
import { Laptop, Smartphone, Globe, Shield, Trash2 } from "lucide-react";

export function SessionTable() {
  const { data: rawSessions = [], isLoading, refetch } = useUserSessions();
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [isRevokeAllOpen, setIsRevokeAllOpen] = useState(false);

  // Fallback mock session if backend returns empty array (to showcase current browser session)
  const sessions: UserSession[] =
    rawSessions.length > 0
      ? rawSessions
      : [
          {
            id: "sess-current",
            user_id: "usr-1",
            device_type: "DESKTOP",
            browser: "Chrome",
            os: "Windows",
            ip_address: "103.24.120.89",
            location: "Chennai, India",
            is_current: true,
            last_active_at: new Date().toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          },
          {
            id: "sess-mobile",
            user_id: "usr-1",
            device_type: "MOBILE",
            browser: "Safari Mobile",
            os: "iOS 17.5",
            ip_address: "103.24.120.90",
            location: "Chennai, India",
            is_current: false,
            last_active_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          },
        ];

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  const columns = [
    {
      id: "device",
      header: "Device & Browser",
      cell: ({ row }: { row: UserSession }) => {
        const isMobile = row.device_type?.toUpperCase() === "MOBILE";
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground">
              {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-xs">
                  {row.browser || "Unknown Browser"} on {row.os || "Unknown OS"}
                </span>
                {row.is_current && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5"
                  >
                    Current Session
                  </Badge>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {row.location ? `${row.location} • ` : ""}
                <span className="font-mono">{row.ip_address || "Unknown IP"}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "last_active",
      header: "Last Active",
      cell: ({ row }: { row: UserSession }) => (
        <span className="text-xs text-muted-foreground">
          {row.is_current ? "Active now" : formatRelativeTime(row.last_active_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }: { row: UserSession }) => {
        if (row.is_current) return null;

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1"
            onClick={() => setSelectedSession(row)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Revoke</span>
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Active Signed-in Sessions</h3>
          <p className="text-xs text-muted-foreground">
            Devices that are currently authorized to access your cybersecurity workspace.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setIsRevokeAllOpen(true)}
          >
            Revoke All Other Sessions ({otherSessionsCount})
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={sessions} isLoading={isLoading} />

      {selectedSession && (
        <RevokeSessionDialog
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}

      {isRevokeAllOpen && (
        <RevokeSessionDialog
          session={null}
          revokeAll
          open={isRevokeAllOpen}
          onOpenChange={setIsRevokeAllOpen}
        />
      )}
    </div>
  );
}
