"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPasswordSchema, ForgotPasswordFormData } from "../schemas";
import { useRequestPasswordReset } from "../hooks";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const requestResetMutation = useRequestPasswordReset();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await requestResetMutation.mutateAsync(data.email);
    } catch {
      // Regardless of failure/success, show generic confirmation to prevent user enumeration
    } finally {
      setIsSubmitted(true);
    }
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl backdrop-blur-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Forgot your password?</CardTitle>
        <CardDescription className="text-xs">
          Enter your registered email address and we'll deliver instructions to reset your password.
        </CardDescription>
      </CardHeader>

      {isSubmitted ? (
        <CardContent className="space-y-4 text-center py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-foreground">Instructions Sent</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an account matches your email address, you will receive password reset instructions
            shortly.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Return to Sign in</Link>
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-0">
            <FormField
              label="Email address"
              error={errors.email?.message}
              required
              htmlFor="reset-email"
            >
              <div className="relative">
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@organization.com"
                  autoComplete="email"
                  error={!!errors.email}
                  className="pl-9 text-xs"
                  {...register("email")}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </FormField>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" isLoading={requestResetMutation.isPending}>
              Send reset link
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
