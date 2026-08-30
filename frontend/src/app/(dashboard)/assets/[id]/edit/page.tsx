"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAsset, useUpdateAsset } from "@/features/assets/hooks";
import { AssetFormData } from "@/features/assets/schemas";
import { AssetForm } from "@/features/assets/components/AssetForm";
import { ArrowLeft, Server } from "lucide-react";

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = (params?.id as string) || "";

  const { data: asset, isLoading: isAssetLoading } = useAsset(assetId);
  const updateMutation = useUpdateAsset();

  const handleSubmit = async (data: AssetFormData) => {
    await updateMutation.mutateAsync({ id: assetId, payload: data });
    router.push(`/assets/${assetId}`);
  };

  if (isAssetLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-96 rounded-lg bg-muted/40 animate-pulse" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <Server className="h-10 w-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-foreground">Asset Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Cannot edit nonexistent or unauthorized asset.
        </p>
        <Link href="/assets" className="text-xs text-primary hover:underline font-semibold">
          Return to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Back Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/assets/${asset.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Edit Asset: {asset.name}</h1>
          <p className="text-xs text-muted-foreground">
            Update technical attributes, network bindings, criticality, and financial valuation.
          </p>
        </div>
      </div>

      {/* Form */}
      <AssetForm
        initialData={asset}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        onCancel={() => router.push(`/assets/${asset.id}`)}
      />
    </div>
  );
}
