"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  ShieldAlert,
  CircleDollarSign,
  Network,
  Server,
  Bug,
  Wrench,
  ShieldCheck,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Bell,
  Settings,
  Layers,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Calendar,
  History,
  Users,
  Lock,
  Building2,
  Sliders,
  Key,
  Activity,
  Upload,
  Radio,
  Database,
} from "lucide-react";
import { NAVIGATION_CONFIG, NavItem } from "@/lib/constants/navigation";
import { usePermission } from "@/hooks/usePermission";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  LayoutDashboard,
  ShieldAlert,
  CircleDollarSign,
  Network,
  Server,
  Bug,
  Wrench,
  ShieldCheck,
  TrendingUp,
  FileText,
  ClipboardCheck,
  Bell,
  Settings,
  Layers,
  Cpu,
  Briefcase,
  Calendar,
  History,
  Users,
  Lock,
  Building2,
  Sliders,
  Key,
  Activity,
  Upload,
  Radio,
  Database,
};

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const { can } = usePermission();

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out relative z-30 shrink-0",
          isCollapsed ? "w-[72px]" : "w-[260px]",
          className
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground">CyberRisk</span>
                <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                  Impact Analyzer
                </span>
              </div>
            )}
          </Link>

          {/* Collapse / Expand Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                isCollapsed && "mx-auto"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAVIGATION_CONFIG.map((group) => {
            // Filter group items by permission
            const visibleItems = group.items.filter((item) => can(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                {!isCollapsed && (
                  <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-2">
                    {group.groupTitle}
                  </h4>
                )}

                {visibleItems.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Shield;
                  const isActive =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150 relative",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        isCollapsed && "justify-center px-2 py-2.5"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform group-hover:scale-105", isActive ? "text-primary-foreground" : "text-sidebar-foreground/60")} />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}

                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            "ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                            isActive ? "bg-primary-foreground text-primary" : "bg-rose-500 text-white"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="rounded bg-rose-500 px-1 py-0.2 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.href}>{linkContent}</React.Fragment>;
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        {!isCollapsed && (
          <div className="p-3 border-t border-sidebar-border text-[11px] text-sidebar-foreground/50 text-center">
            CyberRisk Platform v1.0.0
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
