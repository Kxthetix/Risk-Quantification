"use client";

import React, { useState } from "react";
import { UserTable } from "@/features/users/components/UserTable";
import { InviteUserDialog } from "@/features/users/components/InviteUserDialog";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/auth/Can";
import { UserPlus } from "lucide-react";

export default function UsersSettingsPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Team & User Directory</h3>
          <p className="text-xs text-muted-foreground">
            Manage organization members, assign role-based permissions, and control tenant access.
          </p>
        </div>

        <Can permission="users:manage">
          <Button size="sm" className="gap-2 shrink-0" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-4 w-4" />
            <span>Invite Team Member</span>
          </Button>
        </Can>
      </div>

      <UserTable />

      <InviteUserDialog open={isInviteOpen} onOpenChange={setIsInviteOpen} />
    </div>
  );
}
