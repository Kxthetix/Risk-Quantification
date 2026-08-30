"use client";

import React from "react";
import { User, UserRole } from "@/types/user";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions/roles";
import { ROLE_PERMISSIONS } from "@/lib/permissions/permissions";
import { UserStatusBadge } from "./UserStatusBadge";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, User as UserIcon, Clock, Laptop } from "lucide-react";

export interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  if (!user) return null;

  const permissions = ROLE_PERMISSIONS[user.role] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-base">{user.full_name}</DialogTitle>
                <DialogDescription className="text-xs">{user.email}</DialogDescription>
              </div>
            </div>
            <UserStatusBadge status={user.status} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4 pt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions ({permissions.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/20">
              <div>
                <span className="text-muted-foreground block text-[11px]">Assigned Role</span>
                <span className="font-semibold text-primary">{ROLE_LABELS[user.role]}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Organization ID</span>
                <span className="font-mono text-muted-foreground truncate block">
                  {user.organization_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Account Created</span>
                <span className="text-foreground">{formatDate(user.created_at)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Last Updated</span>
                <span className="text-foreground">{formatRelativeTime(user.updated_at)}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px] font-semibold">
                Role Description & Scope
              </span>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {ROLE_DESCRIPTIONS[user.role]}
              </p>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Direct capabilities granted to <strong>{ROLE_LABELS[user.role]}</strong>:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center gap-1.5 p-1.5 rounded border border-border/60 bg-muted/30 text-[11px]"
                >
                  <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="font-mono text-foreground truncate">{perm}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-semibold text-foreground">Web Client Session</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Active Bearer Authentication
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                  Active
                </Badge>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded border border-border/50 bg-muted/10">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Last recorded activity:</span>
                <span className="font-medium text-foreground">
                  {formatRelativeTime(user.updated_at)}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
