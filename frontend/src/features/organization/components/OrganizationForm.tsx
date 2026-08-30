"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationSettingsSchema, OrganizationSettingsFormData } from "../schemas";
import { useOrganization as useOrgQuery, useUpdateOrganization } from "../hooks";
import { useOrganization as useOrgContext } from "@/providers/OrganizationProvider";
import { BrandingSettings } from "./BrandingSettings";
import { FinancialSettings } from "./FinancialSettings";
import { FormField, FormSection, FormActions } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Can } from "@/components/auth/Can";
import { formatDate } from "@/lib/utils/date";
import { Building2, Palette, DollarSign, Calendar } from "lucide-react";

export function OrganizationForm() {
  const { organization: contextOrg } = useOrgContext();
  const { data: orgData, isLoading } = useOrgQuery(contextOrg?.id);
  const updateMutation = useUpdateOrganization();

  const org = orgData || contextOrg;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<OrganizationSettingsFormData>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: org?.name || "",
      description: org?.description || "",
      industry: org?.industry || "Technology",
      country: org?.settings?.country || "India",
      timezone: org?.settings?.timezone || "Asia/Kolkata",
      default_currency: (org?.settings?.default_currency as any) || "INR",
    },
  });

  useEffect(() => {
    if (org) {
      reset({
        name: org.name || "",
        description: org.description || "",
        industry: org.industry || "Technology",
        country: org.settings?.country || "India",
        timezone: org.settings?.timezone || "Asia/Kolkata",
        default_currency: (org.settings?.default_currency as any) || "INR",
      });
    }
  }, [org, reset]);

  const selectedCurrency = watch("default_currency", "INR");

  const onSubmit = async (data: OrganizationSettingsFormData) => {
    await updateMutation.mutateAsync({
      payload: {
        name: data.name,
        description: data.description || undefined,
        industry: data.industry,
        country: data.country,
        timezone: data.timezone,
        default_currency: data.default_currency,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            <span>Branding</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Financial</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <FormSection
            title="General Parameters"
            description="Core corporate entity identity, industry classification, and localization preferences."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Organization Name"
                error={errors.name?.message}
                required
                htmlFor="org-name"
              >
                <Input
                  id="org-name"
                  placeholder="Enterprise Corporation"
                  error={!!errors.name}
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Industry Sector"
                error={errors.industry?.message}
                required
                htmlFor="org-industry"
              >
                <Input
                  id="org-industry"
                  placeholder="e.g. Banking, FinTech, Healthcare"
                  error={!!errors.industry}
                  {...register("industry")}
                />
              </FormField>

              <FormField
                label="Primary Country"
                error={errors.country?.message}
                required
                htmlFor="org-country"
              >
                <Input
                  id="org-country"
                  placeholder="e.g. India, United States"
                  error={!!errors.country}
                  {...register("country")}
                />
              </FormField>

              <FormField
                label="Organization Timezone"
                error={errors.timezone?.message}
                required
                htmlFor="org-timezone"
              >
                <select
                  id="org-timezone"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("timezone")}
                >
                  <option value="Asia/Kolkata" className="bg-popover text-popover-foreground">
                    Asia/Kolkata (IST +05:30)
                  </option>
                  <option value="UTC" className="bg-popover text-popover-foreground">
                    UTC (Coordinated Universal Time)
                  </option>
                  <option value="America/New_York" className="bg-popover text-popover-foreground">
                    America/New_York (EST/EDT)
                  </option>
                  <option value="Europe/London" className="bg-popover text-popover-foreground">
                    Europe/London (GMT/BST)
                  </option>
                  <option value="Asia/Tokyo" className="bg-popover text-popover-foreground">
                    Asia/Tokyo (JST +09:00)
                  </option>
                  <option value="Australia/Sydney" className="bg-popover text-popover-foreground">
                    Australia/Sydney (AEST/AEDT)
                  </option>
                </select>
              </FormField>
            </div>

            <FormField
              label="Organization Description"
              error={errors.description?.message}
              htmlFor="org-desc"
            >
              <textarea
                id="org-desc"
                rows={3}
                placeholder="Brief summary of business operations and primary risk domains..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("description")}
              />
            </FormField>

            {org?.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Tenant established on {formatDate(org.created_at)}</span>
              </div>
            )}
          </FormSection>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <FormSection
            title="Visual Identity & Logo"
            description="Upload corporate branding assets displayed on executive reports, navigation headers, and dashboards."
          >
            <BrandingSettings />
          </FormSection>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <FormSection
            title="Financial Risk Modeling Parameters"
            description="Configure base currency for probabilistic Monte Carlo loss distribution and annual risk projections."
          >
            <FinancialSettings
              selectedCurrency={selectedCurrency}
              onChange={(curr) => setValue("default_currency", curr, { shouldDirty: true })}
            />
          </FormSection>
        </TabsContent>
      </Tabs>

      <Can permission="settings:edit">
        <FormActions>
          <Button
            type="submit"
            size="sm"
            isLoading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Save Organization Settings
          </Button>
        </FormActions>
      </Can>
    </form>
  );
}
