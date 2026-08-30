"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermission } from "@/hooks/usePermission";
import { Permission } from "@/lib/permissions/permissions";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DashboardWidgetProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  permission?: Permission;
  isLoading?: boolean;
  isError?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}

export function DashboardWidget({
  title,
  subtitle,
  action,
  permission,
  isLoading = false,
  isError = false,
  errorTitle = "Data unavailable",
  errorMessage = "Unable to load telemetry for this widget.",
  onRetry,
  className,
  headerClassName,
  children,
}: DashboardWidgetProps) {
  const { can } = usePermission();

  // If permission specified and not granted, do not render (Section 38)
  if (permission && !can(permission)) {
    return null;
  }

  return (
    <Card className={cn("border-border bg-card/80 shadow-sm flex flex-col", className)}>
      {(title || subtitle || action) && (
        <CardHeader className={cn("p-4 pb-3 flex flex-row items-start justify-between space-y-0", headerClassName)}>
          <div className="space-y-0.5">
            {title && (
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {title}
              </CardTitle>
            )}
            {subtitle && (
              <CardDescription className="text-xs text-muted-foreground">
                {subtitle}
              </CardDescription>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}

      <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-center">
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2 border border-destructive/20 bg-destructive/5 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="text-xs font-medium text-destructive">{errorTitle}</div>
            <p className="text-[11px] text-muted-foreground max-w-xs">{errorMessage}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 mt-1 border-destructive/30 hover:bg-destructive/10"
                onClick={onRetry}
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
