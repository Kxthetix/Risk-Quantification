"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormData } from "@/features/auth/schemas";
import { useCurrentUser, useUpdateProfile } from "@/features/auth/hooks";
import { useAuth } from "@/providers/AuthProvider";
import { useOrganization } from "@/providers/OrganizationProvider";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/permissions/roles";
import { FormField, FormSection, FormActions } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusBadge } from "@/features/users/components/UserStatusBadge";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import { Shield, Clock, Building2, User as UserIcon } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user: authUser } = useAuth();
  const { data: serverUser } = useCurrentUser();
  const { organization } = useOrganization();
  const updateProfileMutation = useUpdateProfile();

  const user = serverUser || authUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.full_name || "",
      email: user?.email || "",
      timezone: "Asia/Kolkata",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName: user.full_name || "",
        email: user.email || "",
        timezone: "Asia/Kolkata",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfileMutation.mutateAsync({
      full_name: data.fullName,
      timezone: data.timezone,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormSection
          title="Personal Profile Information"
          description="Update your display name, contact email, and primary timezone for timestamps."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Full Name"
              error={errors.fullName?.message}
              required
              htmlFor="profile-name"
            >
              <Input
                id="profile-name"
                placeholder="John Doe"
                error={!!errors.fullName}
                {...register("fullName")}
              />
            </FormField>

            <FormField
              label="Email Address"
              description="Managed by your organization SSO / Administrator"
              htmlFor="profile-email"
            >
              <Input
                id="profile-email"
                value={user?.email || ""}
                disabled
                className="bg-muted/40 text-muted-foreground"
              />
            </FormField>

            <FormField
              label="User Timezone"
              error={errors.timezone?.message}
              required
              htmlFor="profile-tz"
            >
              <select
                id="profile-tz"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              </select>
            </FormField>
          </div>

          <FormActions>
            <Button
              type="submit"
              size="sm"
              isLoading={updateProfileMutation.isPending}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </FormActions>
        </FormSection>
      </form>

      {/* Account & Role Metadata Card */}
      <FormSection
        title="Account & Tenant Association"
        description="Read-only identity attributes and role privileges verified against the backend."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span>Assigned Platform Role</span>
              </span>
              <span className="font-semibold text-primary text-xs">
                {user?.role ? ROLE_LABELS[user.role] : "VIEWER"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {user?.role ? ROLE_DESCRIPTIONS[user.role] : ""}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                <span>Organization</span>
              </span>
              <span className="font-semibold text-foreground">
                {organization?.name || "Enterprise Workspace"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <UserStatusBadge status={user?.status || "ACTIVE"} />
            </div>
            {user?.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-foreground">{formatDate(user.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </FormSection>
    </div>
  );
}
