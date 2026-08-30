"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, ShieldAlert, Network, AlertTriangle, FileCheck, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/utils/date";

interface MockNotification {
  id: string;
  title: string;
  description: string;
  type: "CRITICAL_RISK_INCREASE" | "NEW_CRITICAL_ATTACK_PATH" | "SLA_BREACH" | "REPORT_READY";
  createdAt: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: MockNotification[] = [
  {
    id: "n-1",
    title: "Critical Risk Increase Detected",
    description: "Production payment database risk score increased by +18.4%.",
    type: "CRITICAL_RISK_INCREASE",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12m ago
    read: false,
  },
  {
    id: "n-2",
    title: "New Viable Attack Path Found",
    description: "Public API gateway -> Redis Cache -> Internal Financial DB.",
    type: "NEW_CRITICAL_ATTACK_PATH",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
    read: false,
  },
  {
    id: "n-3",
    title: "Remediation SLA Warning",
    description: "CVE-2024-3094 on Edge Router is due in 24 hours.",
    type: "SLA_BREACH",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h ago
    read: false,
  },
  {
    id: "n-4",
    title: "Executive PDF Report Ready",
    description: "Q3 Executive Cybersecurity & Financial Exposure Report is ready.",
    type: "REPORT_READY",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1d ago
    read: true,
  },
];

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<MockNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" aria-label="View notifications">
          <Bell className="h-4 w-4 text-foreground/80" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 sm:w-96" align="end">
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-primary hover:underline font-normal"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup className="max-h-[350px] overflow-y-auto">
          {notifications.map((item) => {
            let icon = <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
            if (item.type === "CRITICAL_RISK_INCREASE") {
              icon = <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
            } else if (item.type === "NEW_CRITICAL_ATTACK_PATH") {
              icon = <Network className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />;
            } else if (item.type === "REPORT_READY") {
              icon = <FileCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
            }

            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className="flex items-start gap-3 p-3 cursor-pointer focus:bg-muted/60"
              >
                {icon}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-medium leading-none ${!item.read ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {item.title}
                    </p>
                    {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                    {item.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 pt-0.5">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <div className="p-1">
          <Button variant="ghost" size="sm" asChild className="w-full text-xs text-primary justify-center">
            <Link href="/alerts">View all alerts</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
