"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/utils/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Uncaught React ErrorBoundary exception:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[450px] w-full flex-col items-center justify-center rounded-xl border border-destructive/20 bg-card p-8 text-center shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Something went wrong</h3>
          <p className="max-w-md text-sm text-muted-foreground mb-6 leading-relaxed">
            An unexpected error occurred in this view. Our telemetry service has logged the issue.
          </p>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
