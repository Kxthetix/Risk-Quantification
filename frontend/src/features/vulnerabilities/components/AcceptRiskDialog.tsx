"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { riskAcceptanceSchema, RiskAcceptanceFormData } from "../schemas";
import { useAcceptRisk } from "../hooks";
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
import { ShieldAlert, AlertTriangle } from "lucide-react";

export interface AcceptRiskDialogProps {
  cveId: string;
  remediationId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcceptRiskDialog({
  cveId,
  remediationId = "rem-default",
  open,
  onOpenChange,
}: AcceptRiskDialogProps) {
  const acceptRiskMutation = useAcceptRisk();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RiskAcceptanceFormData>({
    resolver: zodResolver(riskAcceptanceSchema),
    defaultValues: {
      justification: "",
      expiration_date: new Date(Date.now() + 3600 * 1000 * 24 * 90).toISOString().split("T")[0],
      approved_by: "Chief Information Security Officer (CISO)",
      compensating_controls_in_place: "",
    },
  });

  const onSubmit = async (data: RiskAcceptanceFormData) => {
    await acceptRiskMutation.mutateAsync({
      remediationId,
      payload: data,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldAlert className="h-5 w-5" />
              <DialogTitle className="text-sm font-semibold">
                Formally Accept Cyber Risk for {cveId}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Risk acceptance temporarily suspends remediation SLA requirements and records an auditable justification in the compliance ledger.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <FormField label="Business Justification" required error={errors.justification?.message}>
              <textarea
                {...register("justification")}
                rows={3}
                placeholder="Explain the operational rationale, lack of vendor patch, or business constraint..."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Expiration Date"
                required
                error={errors.expiration_date?.message}
              >
                <Input
                  type="date"
                  {...register("expiration_date")}
                  className="text-xs h-9 font-mono"
                />
              </FormField>

              <FormField label="Executive Approver" required error={errors.approved_by?.message}>
                <Input
                  {...register("approved_by")}
                  placeholder="e.g. CISO / VP SecOps"
                  className="text-xs h-9"
                />
              </FormField>
            </div>

            <FormField
              label="Compensating Defensive Controls in Place"
              error={errors.compensating_controls_in_place?.message}
            >
              <Input
                {...register("compensating_controls_in_place")}
                placeholder="e.g. WAF virtual patch rule, IP allowlist, strict network isolation"
                className="text-xs h-9"
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
            <Button
              type="submit"
              size="sm"
              isLoading={acceptRiskMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Risk Acceptance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
