"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { remediationCreateSchema, RemediationCreateFormData } from "../schemas";
import { REMEDIATION_TYPE_OPTIONS } from "../constants";
import { useCreateRemediation } from "../hooks";
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
import { Wrench, Plus } from "lucide-react";

export interface CreateRemediationModalProps {
  cveId: string;
  defaultTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRemediationModal({
  cveId,
  defaultTitle,
  open,
  onOpenChange,
}: CreateRemediationModalProps) {
  const createMutation = useCreateRemediation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RemediationCreateFormData>({
    resolver: zodResolver(remediationCreateSchema),
    defaultValues: {
      title: defaultTitle || `Patch and mitigate ${cveId} across affected infrastructure`,
      description: `Upgrade vulnerable software packages and apply vendor security patches for ${cveId}.`,
      remediation_type: "PATCH",
      priority_level: "HIGH",
      assigned_team: "Infrastructure SecOps",
      due_date: new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString().split("T")[0],
      estimated_cost: 25000,
      recommended_fix: "Apply latest vendor security update.",
    },
  });

  const onSubmit = async (data: RemediationCreateFormData) => {
    await createMutation.mutateAsync({
      ...data,
      cve_id: cveId,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary">
              <Wrench className="h-5 w-5" />
              <DialogTitle className="text-sm font-semibold">
                Dispatch Remediation Action for {cveId}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Assign a concrete security treatment to engineers to reduce business cyber risk.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <FormField label="Treatment Action Title" required error={errors.title?.message}>
              <Input {...register("title")} className="text-xs h-9" />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Remediation Approach" required error={errors.remediation_type?.message}>
                <select
                  {...register("remediation_type")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {REMEDIATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Urgency Priority" required error={errors.priority_level?.message}>
                <select
                  {...register("priority_level")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="CRITICAL" className="bg-popover text-popover-foreground">Critical (P1)</option>
                  <option value="HIGH" className="bg-popover text-popover-foreground">High (P2)</option>
                  <option value="MEDIUM" className="bg-popover text-popover-foreground">Medium (P3)</option>
                  <option value="LOW" className="bg-popover text-popover-foreground">Low (P4)</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Assigned SecOps Team" error={errors.assigned_team?.message}>
                <Input
                  {...register("assigned_team")}
                  placeholder="e.g. Infrastructure SecOps"
                  className="text-xs h-9"
                />
              </FormField>

              <FormField label="Target SLA Date" error={errors.due_date?.message}>
                <Input type="date" {...register("due_date")} className="text-xs h-9 font-mono" />
              </FormField>
            </div>

            <FormField label="Recommended Fix Guidance" error={errors.recommended_fix?.message}>
              <textarea
                {...register("recommended_fix")}
                rows={2}
                placeholder="Specific patch commands, package versions, or configuration instructions..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </FormField>
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
              Create Remediation Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
