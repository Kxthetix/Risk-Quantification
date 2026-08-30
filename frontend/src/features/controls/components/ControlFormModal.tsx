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
import { controlCreateSchema } from "../schemas";
import { ControlCreateInput, SecurityControl } from "../types";
import { CONTROL_TYPES } from "../constants";
import { useCreateControl, useUpdateControl } from "../hooks";

interface ControlFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  controlToEdit?: SecurityControl | null;
}

export function ControlFormModal({ isOpen, onClose, controlToEdit }: ControlFormModalProps) {
  const createMutation = useCreateControl();
  const updateMutation = useUpdateControl();
  const isEditing = Boolean(controlToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ControlCreateInput>({
    resolver: zodResolver(controlCreateSchema),
    defaultValues: controlToEdit
      ? {
          code: controlToEdit.code,
          name: controlToEdit.name,
          description: controlToEdit.description || "",
          control_type: controlToEdit.control_type,
          effectiveness_score: controlToEdit.effectiveness_score,
          coverage_percentage: controlToEdit.coverage_percentage,
          annual_cost: controlToEdit.annual_cost,
          implementation_cost: controlToEdit.implementation_cost,
          is_active: controlToEdit.is_active,
          notes: controlToEdit.notes || "",
        }
      : {
          code: "WAF-01",
          name: "Cloudflare Enterprise WAF",
          description: "Layer 7 DDoS protection, virtual patching, and bot management filter",
          control_type: "WAF",
          effectiveness_score: 92,
          coverage_percentage: 95,
          annual_cost: 600000,
          implementation_cost: 150000,
          is_active: true,
          notes: "Enforced across all external API endpoints",
        },
  });

  const onSubmit = async (data: ControlCreateInput) => {
    try {
      if (isEditing && controlToEdit) {
        await updateMutation.mutateAsync({
          controlId: controlToEdit.id,
          payload: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to save security control:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Edit Defensive Security Control" : "Register Defensive Security Control"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Configure defensive controls, coverage levels, and financial implementation parameters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Control Code" required error={errors.code?.message}>
              <Input {...register("code")} placeholder="e.g. WAF-01, EDR-02" className="text-xs h-9" />
            </FormField>

            <FormField label="Control Type" required error={errors.control_type?.message}>
              <select
                {...register("control_type")}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CONTROL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Control Name" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="e.g. CrowdStrike Falcon EDR" className="text-xs h-9" />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Input {...register("description")} placeholder="Functional purpose & mitigation scope" className="text-xs h-9" />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Effectiveness % (0-100)" required error={errors.effectiveness_score?.message}>
              <Input
                type="number"
                step="1"
                {...register("effectiveness_score")}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Asset Coverage % (0-100)" required error={errors.coverage_percentage?.message}>
              <Input
                type="number"
                step="1"
                {...register("coverage_percentage")}
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Annual Operating Cost (₹)" required error={errors.annual_cost?.message}>
              <Input
                type="number"
                step="1000"
                {...register("annual_cost")}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField label="Initial Implementation Cost (₹)" required error={errors.implementation_cost?.message}>
              <Input
                type="number"
                step="1000"
                {...register("implementation_cost")}
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_active"
              {...register("is_active")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-xs text-foreground font-medium cursor-pointer">
              Control is actively deployed and operational
            </label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending || isSubmitting}
            >
              {isEditing ? "Update Control" : "Save Control"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
