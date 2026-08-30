"use client";

import React from "react";
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
  Briefcase,
  Calendar,
  History,
  Cpu,
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAVIGATION_CONFIG } from "@/lib/constants/navigation";
import { usePermission } from "@/hooks/usePermission";
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
  Briefcase,
  Calendar,
  History,
  Cpu,
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

export interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const pathname = usePathname();
  const { can } = usePermission();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
        <SheetHeader className="p-4 border-b border-sidebar-border text-left">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <SheetTitle className="text-sm font-bold tracking-tight text-sidebar-foreground">CyberRisk</SheetTitle>
              <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">
                Impact Analyzer
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 max-h-[calc(100vh-4rem)]">
          {NAVIGATION_CONFIG.map((group) => {
            const visibleItems = group.items.filter((item) => can(item.permission));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.groupTitle} className="space-y-1">
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-2">
                  {group.groupTitle}
                </h4>

                {visibleItems.map((item) => {
                  const Icon = ICON_MAP[item.icon] || Shield;
                  const isActive =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-foreground/60")} />
                      <span className="truncate">{item.title}</span>

                      {item.badge && (
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
                })}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
