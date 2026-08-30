"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateAsset } from "@/features/assets/hooks";
import { AssetFormData } from "@/features/assets/schemas";
import { AssetForm } from "@/features/assets/components/AssetForm";
import { ArrowLeft, Server } from "lucide-react";

export default function NewAssetPage() {
  const router = useRouter();
  const createMutation = useCreateAsset();

  const handleSubmit = async (data: AssetFormData) => {
    const res = await createMutation.mutateAsync(data);
    router.push(`/assets/${res.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back Button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Register New Asset</h1>
          <p className="text-xs text-muted-foreground">
            Onboard a physical server, cloud instance, database, container, or web application.
          </p>
        </div>
      </div>

      {/* Asset Form */}
      <AssetForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        onCancel={() => router.push("/assets")}
      />
    </div>
  );
}
