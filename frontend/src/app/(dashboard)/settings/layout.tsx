"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/lib/permissions/permissions";
import { cn } from "@/lib/utils/cn";
import {
  User as UserIcon,
  Building2,
  Users as UsersIcon,
  ShieldAlert,
  Lock,
  Laptop,
  FileText,
} from "lucide-react";

interface SettingsTab {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: Permission;
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    label: "My Profile",
    href: "/settings/profile",
    icon: UserIcon,
  },
  {
    label: "Organization",
    href: "/settings/organization",
    icon: Building2,
    permission: "organizations:view",
  },
  {
    label: "Team & Users",
    href: "/settings/users",
    icon: UsersIcon,
    permission: "users:view",
  },
  {
    label: "Roles & Permissions",
    href: "/settings/roles",
    icon: ShieldAlert,
    permission: "users:view",
  },
  {
    label: "Security Policy",
    href: "/settings/security",
    icon: Lock,
  },
  {
    label: "Active Sessions",
    href: "/settings/security/sessions",
    icon: Laptop,
  },
  {
    label: "Audit Trail",
    href: "/settings/audit",
    icon: FileText,
    permission: "users:manage",
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { can } = usePermission();

  const visibleTabs = SETTINGS_TABS.filter((tab) => {
    if (!tab.permission) return true;
    return can(tab.permission);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Administration"
        description="Manage your account profile, organization parameters, team roles, active devices, and security audit logs."
        breadcrumbs={[{ label: "System" }, { label: "Settings" }]}
      />

      {/* Horizontal Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Settings Tabs">
          {visibleTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "border-primary text-primary font-semibold"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Page Content */}
      <div className="pt-2">{children}</div>
    </div>
  );
}
