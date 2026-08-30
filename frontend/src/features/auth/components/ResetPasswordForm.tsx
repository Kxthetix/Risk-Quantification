"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPasswordSchema, ResetPasswordFormData } from "../schemas";
import { useResetPassword } from "../hooks";
import { PasswordStrength } from "./PasswordStrength";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPasswordMutation = useResetPassword();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError("Invalid or missing password reset token. Please request a new link.");
      return;
    }

    setServerError(null);

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl backdrop-blur-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Set new password</CardTitle>
        <CardDescription className="text-xs">
          Enter a strong, unique password for your organization account.
        </CardDescription>
      </CardHeader>

      {isSuccess ? (
        <CardContent className="space-y-4 text-center py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Password Reset Successfully</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your password has been changed. You may now sign in using your new credentials.
          </p>
          <div className="pt-2">
            <Button asChild className="w-full">
              <Link href="/login">Proceed to Sign in</Link>
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-0">
            {serverError && (
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <FormField
              label="New Password"
              error={errors.password?.message}
              required
              htmlFor="new-password"
            >
              <div className="relative">
                <PasswordInput
                  id="new-password"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  error={!!errors.password}
                  className="pl-9 text-xs"
                  {...register("password")}
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
              </div>
              <PasswordStrength password={passwordValue} />
            </FormField>

            <FormField
              label="Confirm New Password"
              error={errors.confirmPassword?.message}
              required
              htmlFor="confirm-new-password"
            >
              <div className="relative">
                <PasswordInput
                  id="confirm-new-password"
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  className="pl-9 text-xs"
                  {...register("confirmPassword")}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              </div>
            </FormField>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" isLoading={resetPasswordMutation.isPending}>
              Update Password
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
