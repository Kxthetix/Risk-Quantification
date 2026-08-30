"use client";

import React from "react";
import { Permission } from "@/lib/permissions/permissions";
import { usePermission } from "@/hooks/usePermission";

interface CanProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component for role and permission-based UI gating.
 *
 * Example:
 * ```tsx
 * <Can permission="assets:create">
 *   <Button>Add Asset</Button>
 * </Can>
 * ```
 */
export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = usePermission();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
