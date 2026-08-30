"use client";

import React from "react";
import Link from "next/link";
import { ChangePasswordForm } from "@/features/security/components/ChangePasswordForm";
import { FormSection } from "@/components/forms/FormField";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Smartphone, Laptop, ShieldCheck, ArrowRight } from "lucide-react";

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Change Password Section */}
      <FormSection
        title="Account Password"
        description="Ensure your credentials use a strong, unique password to prevent unauthorized access."
      >
        <ChangePasswordForm />
      </FormSection>

      {/* Two-Factor Authentication (MFA) Section */}
      <FormSection
        title="Two-Factor Authentication (2FA / MFA)"
        description="Add an extra layer of defense requiring TOTP verification codes upon sign-in."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Authenticator App (TOTP)
                </span>
                <Badge variant="outline" className="text-[10px] bg-muted/40">
                  Optional
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Use Google Authenticator, Authy, or 1Password to generate time-based one-time codes.
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="text-xs shrink-0" disabled>
            Configure 2FA (Enterprise SSO)
          </Button>
        </div>
      </FormSection>

      {/* Quick Links to Sessions and Audit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-primary" />
                <span>Active Device Sessions</span>
              </CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Inspect active browser logins and terminate remote sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Link href="/settings/security/sessions">
                <span>Manage Sessions</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Security Audit Trail</span>
              </CardTitle>
            </div>
            <CardDescription className="text-xs pt-1">
              Review immutable records of authentication, permission mutations, and API requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-2 text-xs">
              <Link href="/settings/audit">
                <span>View Audit Trail</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
