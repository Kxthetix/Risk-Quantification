"use client";

import React from "react";
import { PermissionMatrix } from "@/features/security/components/PermissionMatrix";

export default function RolesSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Role Hierarchy & Permissions</h3>
        <p className="text-xs text-muted-foreground">
          Explore granular role capabilities, authorization matrices, and functional access across the platform.
        </p>
      </div>

      <PermissionMatrix />
    </div>
  );
}
