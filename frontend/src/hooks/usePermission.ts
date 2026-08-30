"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Permission } from "@/lib/permissions/permissions";
import { hasPermission, hasAllPermissions, hasAnyPermission } from "@/lib/permissions/rbac";
import { UserRole } from "@/types/user";

export function usePermission() {
  const { role, user } = useAuth();

  return {
    role,
    user,
    can: (permission: Permission) => hasPermission(role ?? undefined, permission),
    canAll: (permissions: Permission[]) => hasAllPermissions(role ?? undefined, permissions),
    canAny: (permissions: Permission[]) => hasAnyPermission(role ?? undefined, permissions),
    isRole: (targetRole: UserRole) => role === targetRole,
    isAdmin: role === "ADMIN",
    isSecurityAnalyst: role === "SECURITY_ANALYST" || role === "ADMIN",
    isManager: role === "MANAGER" || role === "ADMIN",
  };
}
