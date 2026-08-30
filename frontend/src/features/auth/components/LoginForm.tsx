"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, AlertCircle, Info } from "lucide-react";
import { loginSchema, LoginFormData } from "../schemas";
import { useLogin } from "../hooks";
import { FormField } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function LoginForm() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@sih-demo.local",
      password: "Admin@1234!",
      rememberMe: false,
    },
  });

  const setPreset = (email: string, pass: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", pass, { shouldValidate: true });
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
    } catch (err: any) {
      setServerError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl backdrop-blur-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-lg font-semibold">Sign in to your account</CardTitle>
        <CardDescription className="text-xs">
          Enter your organization credentials to access the risk dashboard.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 pt-0">
          {/* Session Expired Notice */}
          {reason === "session_expired" && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0" />
              <span>Your session has expired. Please sign in again to continue.</span>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div
              className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive animate-in fade-in-0"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Email Field */}
          <FormField label="Email address" error={errors.email?.message} required htmlFor="email">
            <div className="relative">
              <Input
                id="email"
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

          {/* Password Field */}
          <FormField label="Password" error={errors.password?.message} required htmlFor="password">
            <div className="relative">
              <PasswordInput
                id="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                error={!!errors.password}
                className="pl-9 text-xs"
                {...register("password")}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            </div>
          </FormField>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                {...register("rememberMe")}
              />
              <span>Remember session</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
            Sign in
          </Button>

          {/* Quick Demo Credentials Selector */}
          <div className="w-full rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Demo Login Presets</span>
              <span className="text-[10px] text-primary">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreset("admin@sih-demo.local", "Admin@1234!")}
                className="text-[11px] h-7 px-2 justify-start font-medium"
              >
                👑 Admin / CISO
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreset("analyst@sih-demo.local", "Analyst@1234!")}
                className="text-[11px] h-7 px-2 justify-start font-medium"
              >
                🛡️ SecOps Analyst
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreset("risk.officer@sih-demo.local", "Risk@1234!")}
                className="text-[11px] h-7 px-2 justify-start font-medium"
              >
                📊 Risk Officer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreset("auditor@sih-demo.local", "Audit@1234!")}
                className="text-[11px] h-7 px-2 justify-start font-medium"
              >
                📋 Auditor
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don't have tenant credentials? Contact your Organization Administrator.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
