"use client";

import React, { Suspense } from "react";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { LoadingState } from "@/components/feedback/LoadingState";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingState type="spinner" message="Loading request form..." />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
