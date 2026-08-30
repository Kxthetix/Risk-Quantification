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
import { riskAcceptanceSchema } from "../schemas";
import { Remediation, RiskAcceptanceInput } from "../types";
import { useAcceptRisk } from "../hooks";
import { AlertOctagon, ShieldAlert } from "lucide-react";

interface AcceptRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  remediation: Remediation | null;
}

export function AcceptRiskModal({ isOpen, onClose, remediation }: AcceptRiskModalProps) {
  const acceptRiskMutation = useAcceptRisk();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RiskAcceptanceInput>({
    resolver: zodResolver(riskAcceptanceSchema),
    defaultValues: {
      business_justification:
        "Operational continuity requirement: legacy protocol dependencies prevent immediate binary patching. Mitigated by network segregation.",
      accepted_by: "Chief Information Security Officer (CISO)",
      expiration_date: new Date(Date.now() + 86400000 * 90).toISOString().split("T")[0],
      compensating_controls: "WAF rate-limiting rule + strict subnet firewall isolation.",
    },
  });

  const onSubmit = async (data: RiskAcceptanceInput) => {
    if (!remediation) return;
    try {
      await acceptRiskMutation.mutateAsync({
        remediationId: remediation.id,
        payload: data,
      });
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to accept risk:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-amber-400" />
            Formal Risk Acceptance Workflow
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Formally accept residual vulnerability risk with executive sign-off, time-bound expiration, and compensating controls.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <span className="font-semibold text-foreground">{remediation?.title}</span>
            <span className="text-xs text-muted-foreground block mt-0.5 font-mono">
              Priority: {remediation?.priority_level} | Estimated Loss: ₹
              {remediation?.expected_loss_reduction?.toLocaleString()}
            </span>
          </div>

          <FormField
            label="Business Justification &amp; Rationale"
            required
            error={errors.business_justification?.message}
          >
            <textarea
              {...register("business_justification")}
              rows={3}
              className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Approving Authority" required error={errors.accepted_by?.message}>
              <Input {...register("accepted_by")} className="text-xs h-9" />
            </FormField>

            <FormField label="Expiration Date" required error={errors.expiration_date?.message}>
              <Input type="date" {...register("expiration_date")} className="text-xs h-9" />
            </FormField>
          </div>

          <FormField
            label="Compensating Security Controls"
            error={errors.compensating_controls?.message}
          >
            <Input
              {...register("compensating_controls")}
              placeholder="e.g. WAF virtual patch, microsegmentation"
              className="text-xs h-9"
            />
          </FormField>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={acceptRiskMutation.isPending || isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Sign &amp; Accept Risk
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
