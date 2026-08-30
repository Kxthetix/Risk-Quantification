import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export interface UserStatusBadgeProps {
  status?: string;
  className?: string;
}

export function UserStatusBadge({ status = "ACTIVE", className }: UserStatusBadgeProps) {
  const normalized = status.toUpperCase();

  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    INVITED: {
      label: "Invited",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    },
    SUSPENDED: {
      label: "Suspended",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    DEACTIVATED: {
      label: "Deactivated",
      className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
  };

  const current = config[normalized] || {
    label: normalized,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium text-[11px] px-2 py-0.5 capitalize", current.className, className)}
    >
      {current.label}
    </Badge>
  );
}
