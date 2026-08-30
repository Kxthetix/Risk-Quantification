import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { remediationCreateSchema } from "../schemas";
import { RemediationCreateInput } from "../types";
import { REMEDIATION_TYPES } from "../constants";
import { useCreateRemediation } from "../hooks";

interface CreateRemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetVulnerabilityId?: string | null;
}

export function CreateRemediationModal({
  isOpen,
  onClose,
  assetVulnerabilityId,
}: CreateRemediationModalProps) {
  const createMutation = useCreateRemediation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RemediationCreateInput>({
    resolver: zodResolver(remediationCreateSchema),
    defaultValues: {
      asset_vulnerability_id: assetVulnerabilityId || null,
      title: "Apply Security Patch & Deploy Compensating WAF Rule",
      description: "Applies software patch and virtual patching to prevent exploitation.",
      remediation_type: "PATCH",
      estimated_cost: 150000,
      estimated_duration_hours: 8,
      due_date: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
      assigned_to: "DevSecOps Engineering",
      cost_details: {
        minimum_cost: 100000,
        most_likely_cost: 150000,
        maximum_cost: 250000,
        labor_cost: 100000,
        technology_cost: 50000,
        one_time_cost: 150000,
        recurring_annual_cost: 0,
        confidence: 0.9,
      },
    },
  });

  const onSubmit = async (data: RemediationCreateInput) => {
    try {
      await createMutation.mutateAsync(data);
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to create remediation:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Contextual Remediation Action</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Register a mitigation task with multi-factor risk reduction &amp; ROSI quantification.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
          <FormField label="Remediation Title" required error={errors.title?.message}>
            <Input {...register("title")} className="text-xs h-9" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Remediation Type" required error={errors.remediation_type?.message}>
              <select
                {...register("remediation_type")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {REMEDIATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Assigned Team / Owner" error={errors.assigned_to?.message}>
              <Input {...register("assigned_to")} placeholder="e.g. Infrastructure Team" className="text-xs h-9" />
            </FormField>
          </div>

          <FormField label="Description &amp; Implementation Scope" error={errors.description?.message}>
            <Input {...register("description")} placeholder="Actionable steps & rollout procedure" className="text-xs h-9" />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Estimated Cost (₹)" required error={errors.estimated_cost?.message}>
              <Input
                type="number"
                step="1000"
                {...register("estimated_cost")}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Duration (Hours)" error={errors.estimated_duration_hours?.message}>
              <Input
                type="number"
                step="1"
                {...register("estimated_duration_hours")}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Target SLA Date" error={errors.due_date?.message}>
              <Input type="date" {...register("due_date")} className="text-xs h-9" />
            </FormField>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createMutation.isPending || isSubmitting}>
              Create &amp; Prioritize Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
