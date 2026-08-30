"use client";

import React from "react";
import { AuditLogTable } from "@/features/security/components/AuditLogTable";
import { Can } from "@/components/auth/Can";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function AuditLogSettingsPage() {
  return (
    <Can
      permission="users:manage"
      fallback={
        <ErrorState
          title="Access Restricted"
          message="You do not have administrative privileges to inspect organization audit logs."
        />
      }
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Immutable Audit Trail</h3>
          <p className="text-xs text-muted-foreground">
            Complete security event logging of user authentication, RBAC policy changes, asset mutations, and financial simulations.
          </p>
        </div>

        <AuditLogTable />
      </div>
    </Can>
  );
}
