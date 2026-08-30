"use client";

import React from "react";
import Link from "next/link";
import { User as UserIcon, Settings, Shield, LogOut, Building2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { organization } = useOrganization();

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "CR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20"
          aria-label="User profile menu"
        >
          <span className="text-xs">{initials}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground">{user.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 pt-1.5">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {ROLE_LABELS[user.role] || user.role}
              </span>
              {organization && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{organization.name}</span>
                </span>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Security & Sessions</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="flex items-center gap-2 text-rose-500 hover:text-rose-600 focus:text-rose-600 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
