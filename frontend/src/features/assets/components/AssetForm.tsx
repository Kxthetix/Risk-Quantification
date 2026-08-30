"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assetSchema, AssetFormData } from "../schemas";
import {
  ASSET_TYPE_OPTIONS,
  ASSET_CRITICALITY_OPTIONS,
  ASSET_ENVIRONMENT_OPTIONS,
  ASSET_STATUS_OPTIONS,
  DATA_CLASSIFICATION_OPTIONS,
} from "../constants";
import { Asset } from "@/types/asset";
import { useOrganization } from "@/providers/OrganizationProvider";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, ShieldCheck, DollarSign, Globe, Layers, User } from "lucide-react";

export interface AssetFormProps {
  initialData?: Asset;
  onSubmit: (data: AssetFormData) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function AssetForm({
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: AssetFormProps) {
  const { currency } = useOrganization();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      asset_type: initialData?.asset_type || "SERVER",
      hostname: initialData?.hostname || "",
      ip_address: initialData?.ip_address || "",
      mac_address: initialData?.mac_address || "",
      operating_system: initialData?.operating_system || "",
      os_version: initialData?.os_version || "",
      environment: initialData?.environment || "PRODUCTION",
      criticality: initialData?.criticality || "MEDIUM",
      business_value: initialData?.business_value || undefined,
      data_classification: initialData?.data_classification || "INTERNAL",
      internet_exposed: initialData?.internet_exposed || false,
      status: initialData?.status || "ACTIVE",
      location: initialData?.location || "",
      owner: initialData?.owner || "",
    },
  });

  const selectedType = watch("asset_type");
  const isNetworkDevice =
    selectedType === "NETWORK_DEVICE" ||
    selectedType === "FIREWALL" ||
    selectedType === "ROUTER" ||
    selectedType === "SWITCH";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1. Basic Information */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Server className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">1. Basic Identification</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Primary naming and asset classification in your technology catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Asset Name" required error={errors.name?.message}>
              <Input
                {...register("name")}
                placeholder="e.g. Payment Processing Gateway API (prod-api-01)"
                className="text-xs h-9"
              />
            </FormField>

            <FormField label="Asset Classification Type" required error={errors.asset_type?.message}>
              <select
                {...register("asset_type")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Description & Workload Purpose" error={errors.description?.message}>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Describe the operational role, hosted applications, and data handled by this asset..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* 2. Technical & Network Details */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Globe className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">2. Technical & Network Attributes</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Hostnames, network address bindings, and operating environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="IP Address (IPv4 / IPv6)" error={errors.ip_address?.message}>
              <Input
                {...register("ip_address")}
                placeholder="e.g. 192.168.1.100 or 203.0.113.15"
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Hostname / FQDN" error={errors.hostname?.message}>
              <Input
                {...register("hostname")}
                placeholder="e.g. api-prod-01.internal.corp"
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="MAC Address" error={errors.mac_address?.message}>
              <Input
                {...register("mac_address")}
                placeholder="e.g. 00:1A:2B:3C:4D:5E"
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Operating System / Firmware" error={errors.operating_system?.message}>
              <Input
                {...register("operating_system")}
                placeholder="e.g. Ubuntu Linux / Windows Server / AWS Linux"
                className="text-xs h-9"
              />
            </FormField>

            <FormField label="OS / Kernel Version" error={errors.os_version?.message}>
              <Input
                {...register("os_version")}
                placeholder="e.g. 22.04 LTS / 10.0.19041"
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Deployment Environment" required error={errors.environment?.message}>
              <select
                {...register("environment")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSET_ENVIRONMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* 3. Ownership & Business Classification */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <User className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">3. Ownership & Criticality</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Organizational accountability and operational criticality classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Asset Criticality Tier" required error={errors.criticality?.message}>
              <select
                {...register("criticality")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSET_CRITICALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Data Sensitivity" required error={errors.data_classification?.message}>
              <select
                {...register("data_classification")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {DATA_CLASSIFICATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned Owner / Team" error={errors.owner?.message}>
              <Input
                {...register("owner")}
                placeholder="e.g. Infrastructure SecOps / Core Payments"
                className="text-xs h-9"
              />
            </FormField>

            <FormField label="Data Center / Cloud Region" error={errors.location?.message}>
              <Input
                {...register("location")}
                placeholder="e.g. ap-south-1 (Mumbai) / AWS Prod VPC"
                className="text-xs h-9"
              />
            </FormField>
          </div>

          {/* Internet Exposed Switch */}
          <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/20 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-amber-500" />
                <span>Internet-Facing Asset (Public Edge Exposure)</span>
              </span>
              <p className="text-[11px] text-muted-foreground">
                Check this if the endpoint or service is directly reachable from the public internet without VPN access.
              </p>
            </div>
            <input
              type="checkbox"
              {...register("internet_exposed")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Financial Valuation */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign className="h-4 w-4" />
            <CardTitle className="text-sm font-semibold">4. Financial Asset Valuation</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Monetary value feeding directly into FAIR & Monte Carlo annualized loss modeling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={`Estimated Asset Value (${currency})`}
              error={errors.business_value?.message}
            >
              <Input
                type="number"
                step="any"
                {...register("business_value")}
                placeholder="e.g. 2500000"
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Lifecycle Operational Status" required error={errors.status?.message}>
              <select
                {...register("status")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ASSET_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isLoading} className="gap-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span>{initialData ? "Save Asset Changes" : "Register Asset"}</span>
        </Button>
      </div>
    </form>
  );
}
