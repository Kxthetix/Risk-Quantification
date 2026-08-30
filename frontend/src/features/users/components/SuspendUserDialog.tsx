"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { suspendUserSchema, SuspendUserFormData } from "../schemas";
import { useSuspendUser } from "../hooks";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

export interface SuspendUserDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuspendUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: SuspendUserDialogProps) {
  const suspendMutation = useSuspendUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SuspendUserFormData>({
    resolver: zodResolver(suspendUserSchema),
  });

  const onSubmit = async (data: SuspendUserFormData) => {
    try {
      await suspendMutation.mutateAsync({
        id: userId,
        reason: data.reason,
      });
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
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Suspend User Account</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Suspending <strong>{userName}</strong> will immediately revoke their active sessions and
            prevent further platform authentication.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <FormField
            label="Suspension Reason (Audit Logged)"
            error={errors.reason?.message}
            required
            htmlFor="suspend-reason"
          >
            <textarea
              id="suspend-reason"
              rows={3}
              placeholder="e.g. Employee offboarding / security incident investigation..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("reason")}
            />
          </FormField>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={suspendMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              isLoading={suspendMutation.isPending}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
