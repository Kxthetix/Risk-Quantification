"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Trash2,
  CheckCheck,
  ExternalLink,
  Filter,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "../hooks";
import type { NotificationItem, NotificationSeverity } from "../types";

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  switch (severity) {
    case "CRITICAL":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertOctagon className="w-3 h-3" /> Critical
        </span>
      );
    case "HIGH":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" /> High
        </span>
      );
    case "MEDIUM":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
          <AlertTriangle className="w-3 h-3" /> Medium
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Info className="w-3 h-3" /> Info
        </span>
      );
  }
}

export function NotificationCenter() {
  const [tab, setTab] = useState<"all" | "unread" | "critical">("all");
  const { data: notifications, isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const filtered = (notifications || []).filter((item) => {
    if (tab === "unread") return !item.read;
    if (tab === "critical") return item.severity === "CRITICAL" || item.severity === "HIGH";
    return true;
  });

  const unreadCount = (notifications || []).filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            Notification Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time security alerts, workflow approvals, and system notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50 transition-colors border border-slate-700"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            Mark All as Read
          </button>
          <Link
            href="/settings/notifications"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm"
          >
            Preferences
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setTab("all")}
          className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All ({notifications?.length || 0})
        </button>
        <button
          onClick={() => setTab("unread")}
          className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "unread"
              ? "bg-slate-800 text-indigo-400 border border-indigo-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setTab("critical")}
          className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "critical"
              ? "bg-slate-800 text-rose-400 border border-rose-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Critical & High
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No notifications</h3>
          <p className="text-sm text-slate-500 mt-1">You are all caught up on all platform signals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                item.read
                  ? "bg-slate-900/40 border-slate-800/80 text-slate-400"
                  : "bg-slate-850/80 border-slate-700/80 shadow-sm text-slate-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  <SeverityBadge severity={item.severity} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
                  <span className="text-xs text-slate-500 block">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!item.read && (
                  <button
                    onClick={() => markReadMutation.mutate(item.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  title="Dismiss notification"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
