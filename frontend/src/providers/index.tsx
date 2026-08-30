"use client";

import React from "react";
import { QueryProvider } from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { OrganizationProvider } from "./OrganizationProvider";
import { ToastProvider } from "./ToastProvider";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <OrganizationProvider>
            <ToastProvider>{children}</ToastProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export * from "./QueryProvider";
export * from "./ThemeProvider";
export * from "./AuthProvider";
export * from "./OrganizationProvider";
export * from "./ToastProvider";
