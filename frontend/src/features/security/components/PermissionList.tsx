import React from "react";
import { Check, X } from "lucide-react";
import { UserRole } from "@/types/user";
import { ROLE_PERMISSIONS, Permission } from "@/lib/permissions/permissions";
import { cn } from "@/lib/utils/cn";

export interface PermissionListProps {
  role: UserRole;
  className?: string;
}

export function PermissionList({ role, className }: PermissionListProps) {
  const granted = new Set(ROLE_PERMISSIONS[role] || []);

  const categories: Record<string, Permission[]> = {
    "Dashboard & Executive Overview": ["dashboard:view", "dashboard:export"],
    "Asset Management": ["assets:view", "assets:create", "assets:edit", "assets:delete", "assets:export", "assets:import"],
    "Vulnerability Intelligence": ["vulnerabilities:view", "vulnerabilities:sync", "vulnerabilities:validate"],
    "Risk & Attack Paths": ["risk:view", "risk:recalculate", "risk:configure", "financial:view", "financial:simulate", "attack_paths:view", "attack_paths:analyze"],
    "Security Controls & Remediation": ["remediation:view", "remediation:create", "remediation:edit", "controls:view", "controls:manage", "investments:view", "investments:optimize"],
    "Reporting & Compliance": ["reports:view", "reports:create", "reports:download", "compliance:view", "compliance:evaluate"],
    "User & Organization Admin": ["users:view", "users:manage", "organizations:view", "organizations:edit", "settings:view", "settings:edit", "alerts:view", "alerts:acknowledge"],
  };

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(categories).map(([catName, perms]) => (
        <div key={catName} className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
            {catName}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {perms.map((perm) => {
              const isAllowed = granted.has(perm);
              return (
                <div
                  key={perm}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border text-xs transition-colors",
                    isAllowed
                      ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                      : "border-border/40 bg-muted/20 text-muted-foreground opacity-50"
                  )}
                >
                  {isAllowed ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] truncate">{perm}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
