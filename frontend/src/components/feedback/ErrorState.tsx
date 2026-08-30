import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFriendlyErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  error?: any;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  error,
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  const displayMessage = message || (error ? getFriendlyErrorMessage(error) : "An unexpected error occurred while communicating with the analytics service.");

  return (
    <div
      className={cn(
        "flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
      <p className="max-w-md text-sm text-muted-foreground mb-6 leading-relaxed">{displayMessage}</p>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 border-border">
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </Button>
      )}
    </div>
  );
}
