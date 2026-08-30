"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = "default", duration = 5000, action }: Omit<ToastItem, "id">): string => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, variant, duration, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast Render Stack */}
      <div
        aria-live="assertive"
        className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]"
      >
        {toasts.map((t) => {
          let icon = <Info className="h-5 w-5 text-blue-500 shrink-0" />;
          let borderClass = "border-border";
          let bgClass = "bg-card text-card-foreground";

          if (t.variant === "success") {
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
            borderClass = "border-emerald-500/30";
          } else if (t.variant === "warning") {
            icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
            borderClass = "border-amber-500/30";
          } else if (t.variant === "error") {
            icon = <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />;
            borderClass = "border-rose-500/30";
          }

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-200 ease-in-out mt-2 animate-in fade-in-0 slide-in-from-bottom-5",
                bgClass,
                borderClass
              )}
            >
              {icon}
              <div className="grid gap-1 flex-1 pr-2">
                <p className="text-sm font-semibold leading-tight">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>}
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const toast = context.toast;
  const dismiss = context.dismiss;

  return {
    toast,
    dismiss,
    success: (title: string, description?: string) => toast({ title, description, variant: "success" }),
    error: (title: string, description?: string) => toast({ title, description, variant: "error" }),
    warning: (title: string, description?: string) => toast({ title, description, variant: "warning" }),
    info: (title: string, description?: string) => toast({ title, description, variant: "info" }),
  };
}
