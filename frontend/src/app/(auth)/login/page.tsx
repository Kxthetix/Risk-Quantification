"use client";

import React, { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoadingState } from "@/components/feedback/LoadingState";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState type="spinner" message="Loading sign-in form..." />}>
      <LoginForm />
    </Suspense>
  );
}
