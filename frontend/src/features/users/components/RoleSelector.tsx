"use client";

import React, { useState } from "react";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/permissions/roles";
import { UserRole } from "@/types/user";
import { Shield, ShieldAlert, ShieldCheck, Eye, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateUserRole } from "../hooks";

export interface RoleSelectorProps {
  userId: string;
  userName: string;
  currentRole: UserRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLES: { id: UserRole; label: string; icon: React.ReactNode; impact: string }[] = [
  {
    id: "ADMIN",
    label: "Organization Administrator",
    icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
    impact: "Grants full administrative access including user management, organization settings, asset deletion, and financial recalculation.",
  },
  {
    id: "SECURITY_ANALYST",
    label: "Security Analyst",
    icon: <ShieldCheck className="h-4 w-4 text-primary" />,
    impact: "Grants access to run vulnerability syncs, manage attack paths, execute Monte Carlo risk simulations, and create remediation plans.",
  },
  {
    id: "MANAGER",
    label: "Manager / Lead",
    icon: <Shield className="h-4 w-4 text-amber-500" />,
    impact: "Grants ability to view all risk models, manage team reports, and review business impact without modifying root organization policies.",
  },
  {
    id: "VIEWER",
    label: "Executive Viewer",
    icon: <Eye className="h-4 w-4 text-muted-foreground" />,
    impact: "Read-only access to executive dashboards, high-level loss projections, compliance matrices, and generated reports.",
  },
];

export function RoleSelector({
  userId,
  userName,
  currentRole,
  open,
  onOpenChange,
}: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const updateRoleMutation = useUpdateUserRole();

  const handleConfirm = async () => {
    if (selectedRole === currentRole) {
      onOpenChange(false);
      return;
    }

    try {
      await updateRoleMutation.mutateAsync({
        id: userId,
        role: selectedRole,
      });
      onOpenChange(false);
    } catch {
      // Handled in mutation
    }
  };

  const selectedRoleObj = ROLES.find((r) => r.id === selectedRole);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Role for {userName}</DialogTitle>
          <DialogDescription className="text-xs">
            Modifying role permissions immediately updates user privileges across the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="space-y-2">
            {ROLES.map((role) => (
              <label
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedRole === role.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/30"
                }`}
              >
                <input
                  type="radio"
                  name="user-role"
                  value={role.id}
                  checked={selectedRole === role.id}
                  onChange={() => setSelectedRole(role.id)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <span className="text-xs font-semibold text-foreground">{role.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {ROLE_DESCRIPTIONS[role.id]}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {selectedRole !== currentRole && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Privilege Impact</span>
              </div>
              <p className="text-[11px] leading-relaxed">{selectedRoleObj?.impact}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={updateRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            isLoading={updateRoleMutation.isPending}
            disabled={selectedRole === currentRole}
          >
            Update Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
