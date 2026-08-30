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
import { controlEffectivenessCreateSchema } from "../schemas";
import { ControlEffectivenessInput, SecurityControl } from "../types";
import { useAddControlEffectiveness } from "../hooks";

interface ControlEffectivenessModalProps {
  isOpen: boolean;
  onClose: () => void;
  control: SecurityControl | null;
}

export function ControlEffectivenessModal({
  isOpen,
  onClose,
  control,
}: ControlEffectivenessModalProps) {
  const addMutation = useAddControlEffectiveness();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ControlEffectivenessInput>({
    resolver: zodResolver(controlEffectivenessCreateSchema),
    defaultValues: {
      threat_scenario_type: "RANSOMWARE",
      risk_factor_type: "LATERAL_MOVEMENT",
      vulnerability_category: "REMOTE_CODE_EXECUTION",
      attenuation_factor: 0.85,
      confidence: 0.9,
      description: "Significantly reduces lateral traversal and unauthenticated command execution.",
    },
  });

  const onSubmit = async (data: ControlEffectivenessInput) => {
    if (!control) return;
    try {
      await addMutation.mutateAsync({
        controlId: control.id,
        payload: data,
      });
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to add control effectiveness:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Targeted Mitigation Mapping — {control?.code}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Define empirical attenuation factors against specific threat categories and risk factors.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
          <div className="rounded-lg bg-muted/40 p-3 border border-border">
            <span className="font-semibold text-foreground">{control?.name}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              Type: {control?.control_type} | Base Effectiveness: {control?.effectiveness_score}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Threat Scenario Type" error={errors.threat_scenario_type?.message}>
              <Input
                {...register("threat_scenario_type")}
                placeholder="e.g. RANSOMWARE, DATA_EXFILTRATION"
                className="text-xs h-9"
              />
            </FormField>

            <FormField label="Risk Factor Type" error={errors.risk_factor_type?.message}>
              <Input
                {...register("risk_factor_type")}
                placeholder="e.g. LATERAL_MOVEMENT, EXPLOITABILITY"
                className="text-xs h-9"
              />
            </FormField>
          </div>

          <FormField label="Vulnerability Category" error={errors.vulnerability_category?.message}>
            <Input
              {...register("vulnerability_category")}
              placeholder="e.g. REMOTE_CODE_EXECUTION, SQL_INJECTION"
              className="text-xs h-9"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="Attenuation Factor (0.01 - 1.0)"
              required
              error={errors.attenuation_factor?.message}
            >
              <Input
                type="number"
                step="0.05"
                min="0.01"
                max="1.0"
                {...register("attenuation_factor")}
                className="text-xs h-9 font-mono"
              />
            </FormField>

            <FormField
              label="Confidence Level (0.1 - 1.0)"
              required
              error={errors.confidence?.message}
            >
              <Input
                type="number"
                step="0.05"
                min="0.1"
                max="1.0"
                {...register("confidence")}
                className="text-xs h-9 font-mono"
              />
            </FormField>
          </div>

          <FormField label="Validation Notes" error={errors.description?.message}>
            <Input
              {...register("description")}
              placeholder="Empirical testing evidence, lab findings or vendor benchmark"
              className="text-xs h-9"
            />
          </FormField>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={addMutation.isPending || isSubmitting}>
              Add Attenuation Mapping
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
