"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessServiceSchema, BusinessServiceFormData } from "../schemas";
import { useCreateBusinessService } from "../hooks";
import { useOrganization } from "@/providers/OrganizationProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus } from "lucide-react";

export interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateServiceDialog({ open, onOpenChange }: CreateServiceDialogProps) {
  const { currency } = useOrganization();
  const createMutation = useCreateBusinessService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessServiceFormData>({
    resolver: zodResolver(businessServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      revenue_dependency: 1.0,
      criticality: "HIGH",
      daily_transaction_count: 0,
      average_transaction_value: 0,
    },
  });

  const onSubmit = async (data: BusinessServiceFormData) => {
    await createMutation.mutateAsync(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Briefcase className="h-5 w-5" />
              <DialogTitle className="text-sm font-semibold">
                Register Business Service
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Define a critical business workflow to quantify financial downtime and revenue loss.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <FormField label="Service Name" required error={errors.name?.message}>
              <Input
                {...register("name")}
                placeholder="e.g. Payment Processing Gateway / Customer Onboarding"
                className="text-xs h-9"
              />
            </FormField>

            <FormField label="Description" error={errors.description?.message}>
              <textarea
                {...register("description")}
                rows={2}
                placeholder="Business purpose, customer touchpoints, and operational SLA..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Criticality Tier" required error={errors.criticality?.message}>
                <select
                  {...register("criticality")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CRITICAL" className="bg-popover text-popover-foreground">
                    Critical (Tier 1)
                  </option>
                  <option value="HIGH" className="bg-popover text-popover-foreground">
                    High (Tier 2)
                  </option>
                  <option value="MEDIUM" className="bg-popover text-popover-foreground">
                    Medium (Tier 3)
                  </option>
                  <option value="LOW" className="bg-popover text-popover-foreground">
                    Low (Tier 4)
                  </option>
                </select>
              </FormField>

              <FormField
                label="Revenue Dependency (0 - 1.0)"
                required
                error={errors.revenue_dependency?.message}
              >
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  {...register("revenue_dependency")}
                  className="text-xs h-9 font-mono"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Daily Transactions" error={errors.daily_transaction_count?.message}>
                <Input
                  type="number"
                  {...register("daily_transaction_count")}
                  placeholder="e.g. 50000"
                  className="text-xs h-9 font-mono"
                />
              </FormField>

              <FormField
                label={`Avg Transaction Value (${currency})`}
                error={errors.average_transaction_value?.message}
              >
                <Input
                  type="number"
                  step="any"
                  {...register("average_transaction_value")}
                  placeholder="e.g. 1500"
                  className="text-xs h-9 font-mono"
                />
              </FormField>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending}>
              Register Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
