"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  UserPlus,
  AlertTriangle,
  Server,
  Activity,
  HardDrive,
} from "lucide-react";
import { useAdminDashboard } from "../hooks";

export function AdminDashboardCards() {
  const { data: usage, isLoading } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Users",
      value: usage?.active_users_count ?? 0,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      link: "/admin/users",
    },
    {
      title: "Administrators",
      value: usage?.admin_users_count ?? 0,
      icon: Shield,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
      link: "/admin/users",
    },
    {
      title: "Organizations",
      value: usage?.organizations_count ?? 0,
      icon: Building2,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
      link: "/admin/organizations",
    },
    {
      title: "Pending Invitations",
      value: usage?.pending_invitations_count ?? 0,
      icon: UserPlus,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      link: "/admin/users",
    },
    {
      title: "Critical Alerts",
      value: usage?.critical_alerts_count ?? 0,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      link: "/notifications",
    },
    {
      title: "Integration Failures",
      value: usage?.integration_failures_count ?? 0,
      icon: Server,
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
      link: "/admin/integrations",
    },
    {
      title: "Audit Events",
      value: usage?.audit_events_count ?? 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      link: "/admin/audit",
    },
    {
      title: "API Requests Today",
      value: usage?.api_requests_count ? usage.api_requests_count.toLocaleString() : "0",
      icon: HardDrive,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/20",
      link: "/admin/usage",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Link
            key={i}
            href={card.link}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{card.title}</span>
              <div className={`p-2 rounded-lg border ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                {card.value}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
