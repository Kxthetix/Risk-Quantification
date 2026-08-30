import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export interface LoadingStateProps {
  type?: "spinner" | "skeleton-cards" | "skeleton-table" | "page";
  message?: string;
  className?: string;
}

export function LoadingState({
  type = "spinner",
  message = "Loading risk metrics...",
  className,
}: LoadingStateProps) {
  if (type === "page") {
    return (
      <div className={cn("flex min-h-[400px] w-full flex-col items-center justify-center gap-3 p-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
      </div>
    );
  }

  if (type === "skeleton-cards") {
    return (
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "skeleton-table") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4 shadow-sm space-y-4", className)}>
        <div className="flex items-center justify-between pb-2 border-b">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/6" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center p-6", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}
