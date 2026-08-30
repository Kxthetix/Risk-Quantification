import React from "react";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 bg-background cyber-grid">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40" />

      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">CyberRisk Impact Platform</h1>
          <p className="text-xs text-muted-foreground">
            Enterprise Risk Assessment & Financial Loss Modeling
          </p>
        </div>

        {children}

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground">
          Protected by Enterprise-grade AES-256 & Multi-tenant RBAC Isolation
        </div>
      </div>
    </div>
  );
}
