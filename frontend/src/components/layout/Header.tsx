"use client";

import React from "react";
import Link from "next/link";
import { Shield, Menu, Building2 } from "lucide-react";
import { CommandMenu } from "@/components/navigation/CommandMenu";
import { NotificationsPopover } from "@/components/navigation/NotificationsPopover";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { UserMenu } from "@/components/navigation/UserMenu";
import { useOrganization } from "@/providers/OrganizationProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface HeaderProps {
  onOpenMobileNav?: () => void;
  className?: string;
}

export function Header({ onOpenMobileNav, className }: HeaderProps) {
  const { organization } = useOrganization();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md transition-all sm:px-6",
        className
      )}
    >
      {/* Left: Mobile Menu Toggle & Brand / Org */}
      <div className="flex items-center gap-3">
        {onOpenMobileNav && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileNav}
            className="md:hidden h-9 w-9 rounded-md"
            aria-label="Open navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Brand Link on Mobile */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight">CyberRisk</span>
        </Link>

        {/* Active Organization Badge (Desktop) */}
        {organization && (
          <div className="hidden lg:flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-foreground font-semibold truncate max-w-[180px]">{organization.name}</span>
            {organization.industry && (
              <span className="text-[10px] text-muted-foreground opacity-80">({organization.industry})</span>
            )}
          </div>
        )}
      </div>

      {/* Center: Global Command Search */}
      <div className="flex items-center gap-2">
        <CommandMenu />
      </div>

      {/* Right: Notifications, Theme Switcher & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <NotificationsPopover />
        <ThemeToggle />
        <div className="h-5 w-px bg-border mx-1" />
        <UserMenu />
      </div>
    </header>
  );
}
