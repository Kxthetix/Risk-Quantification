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
import { remediationVerifySchema } from "../schemas";
import { Remediation, RemediationVerifyInput } from "../types";
import { useVerifyRemediation } from "../hooks";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface VerifyRemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remediation: Remediation | null;
}

export function VerifyRemediationModal({
  isOpen,
  onClose,
  remediation,
}: VerifyRemediationModalProps) {
  const verifyMutation = useVerifyRemediation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RemediationVerifyInput>({
    resolver: zodResolver(remediationVerifySchema),
    defaultValues: {
      evidence: {
        scan_tool: "QUALYS_VULN_SCANNER",
        scan_id: "SCAN-20260830-01",
        verified_by: "Security Operations Center",
        result: "PATCH_CONFIRMED_CLEAN",
      },
      verification_notes: "Automated vulnerability re-scan confirmed CVE vulnerability resolved and port closed.",
    },
  });

  const onSubmit = async (data: RemediationVerifyInput) => {
    if (!remediation) return;
    try {
      await verifyMutation.mutateAsync({
        remediationId: remediation.id,
        payload: data,
      });
      reset();
      onClose();
    } catch (err) {
      console.error("Failed to verify remediation:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Empirical Remediation Verification
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Confirm empirical proof and close linked asset-vulnerability findings with audit evidence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2 text-xs">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
            <span className="font-semibold text-foreground">{remediation?.title}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">
              Type: {remediation?.remediation_type} | Priority: {remediation?.priority_level}
            </span>
          </div>

          <FormField label="Verification Notes & Evidence Summary">
            <Input
              {...register("verification_notes")}
              placeholder="e.g. Clean rescan confirmed on Tenable / Qualys / Snyk"
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
              isLoading={verifyMutation.isPending || isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Verify &amp; Close Finding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
