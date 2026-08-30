"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inviteUserSchema, InviteUserFormData } from "../schemas";
import { useInviteUser } from "../hooks";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, User as UserIcon, Shield } from "lucide-react";

export interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const inviteMutation = useInviteUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "SECURITY_ANALYST",
      message: "",
    },
  });

  const onSubmit = async (data: InviteUserFormData) => {
    try {
      await inviteMutation.mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch {
      // Handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription className="text-xs">
            Send an onboarding invitation link to join your organization's risk assessment platform.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField label="Email Address" error={errors.email?.message} required htmlFor="invite-email">
            <div className="relative">
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@organization.com"
                error={!!errors.email}
                className="pl-9 text-xs"
                {...register("email")}
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </FormField>

          <FormField label="Full Name" error={errors.full_name?.message} required htmlFor="invite-name">
            <div className="relative">
              <Input
                id="invite-name"
                placeholder="John Doe"
                error={!!errors.full_name}
                className="pl-9 text-xs"
                {...register("full_name")}
              />
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </FormField>

          <FormField label="Platform Role" error={errors.role?.message} required htmlFor="invite-role">
            <div className="relative">
              <select
                id="invite-role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("role")}
              >
                <option value="VIEWER" className="bg-popover text-popover-foreground">
                  Executive Viewer (Read-only dashboards)
                </option>
                <option value="SECURITY_ANALYST" className="bg-popover text-popover-foreground">
                  Security Analyst (Assess risk, manage assets & vulns)
                </option>
                <option value="MANAGER" className="bg-popover text-popover-foreground">
                  Manager / Lead (Review risk & reports)
                </option>
                <option value="ADMIN" className="bg-popover text-popover-foreground">
                  Organization Administrator (Full root control)
                </option>
              </select>
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </FormField>

          <FormField label="Invitation Message (Optional)" error={errors.message?.message} htmlFor="invite-msg">
            <textarea
              id="invite-msg"
              rows={2}
              placeholder="Add a personalized welcome note..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("message")}
            />
          </FormField>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={inviteMutation.isPending}>
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
