"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordFormData } from "../schemas";
import { useChangePassword } from "@/features/auth/hooks";
import { PasswordStrength } from "@/features/auth/components/PasswordStrength";
import { FormField, FormActions } from "@/components/forms/FormField";
import { PasswordInput } from "@/components/forms/PasswordInput";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { getFriendlyErrorMessage } from "@/lib/api/errors";

export function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword", "");

  const onSubmit = async (data: ChangePasswordFormData) => {
    setServerError(null);
    try {
      await changePasswordMutation.mutateAsync({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      reset();
    } catch (err: any) {
      setServerError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
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
        label="Current Password"
        error={errors.currentPassword?.message}
        required
        htmlFor="curr-pwd"
      >
        <div className="relative">
          <PasswordInput
            id="curr-pwd"
            placeholder="••••••••••••"
            autoComplete="current-password"
            error={!!errors.currentPassword}
            className="pl-9 text-xs"
            {...register("currentPassword")}
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        </div>
      </FormField>

      <FormField
        label="New Password"
        error={errors.newPassword?.message}
        required
        htmlFor="new-pwd"
      >
        <div className="relative">
          <PasswordInput
            id="new-pwd"
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={!!errors.newPassword}
            className="pl-9 text-xs"
            {...register("newPassword")}
          />
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
        </div>
        <PasswordStrength password={newPasswordValue} />
      </FormField>

      <FormField
        label="Confirm New Password"
        error={errors.confirmNewPassword?.message}
        required
        htmlFor="confirm-new-pwd"
      >
        <div className="relative">
          <PasswordInput
            id="confirm-new-pwd"
            placeholder="••••••••••••"
            autoComplete="new-password"
            error={!!errors.confirmNewPassword}
            className="pl-9 text-xs"
            {...register("confirmNewPassword")}
          />
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        </div>
      </FormField>

      <FormActions>
        <Button
          type="submit"
          size="sm"
          isLoading={changePasswordMutation.isPending}
          disabled={!isDirty}
        >
          Update Password
        </Button>
      </FormActions>
    </form>
  );
}
