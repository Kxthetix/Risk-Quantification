"use client";

import React, { Suspense } from "react";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { LoadingState } from "@/components/feedback/LoadingState";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState type="spinner" message="Loading password reset form..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
