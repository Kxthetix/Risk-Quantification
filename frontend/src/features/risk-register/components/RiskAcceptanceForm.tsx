"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRiskAcceptance } from "../index";
import { RiskAcceptanceCreateSchema, type RiskAcceptanceCreateFormData } from "../index";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

interface RiskAcceptanceFormProps {
  riskId: string;
  onSuccess?: () => void;
}

export function RiskAcceptanceForm({ riskId, onSuccess }: RiskAcceptanceFormProps) {
  const [success, setSuccess] = useState(false);
  const mutation = useCreateRiskAcceptance();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RiskAcceptanceCreateFormData>({
    resolver: zodResolver(RiskAcceptanceCreateSchema),
    defaultValues: {
      risk_id: riskId,
      reason: "",
      business_justification: "",
      acceptance_duration_days: 90,
      approver_id: "00000000-0000-0000-0000-000000000000", // system dummy
    },
  });

  const onSubmit = async (data: RiskAcceptanceCreateFormData) => {
    await mutation.mutateAsync(data);
    setSuccess(true);
    if (onSuccess) onSuccess();
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green-400 mb-2" />
        <h4 className="font-semibold text-white">Request Submitted</h4>
        <p className="text-sm text-gray-400 mt-1">
          The risk acceptance request has been submitted for review by a manager or administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-5">
      <h3 className="font-semibold text-white mb-2">Request Risk Acceptance</h3>
      <p className="text-xs text-gray-400 mb-4">
        Temporarily accept a risk due to specific business constraints or operational requirements.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("risk_id")} value={riskId} />

        <div>
          <label className="text-xs text-gray-400">Duration (Days)</label>
          <select
            {...register("acceptance_duration_days", { valueAsNumber: true })}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={180}>180 Days</option>
            <option value={365}>1 Year</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-400">Technical Reason</label>
          <textarea
            {...register("reason")}
            placeholder="e.g. Threat is attenuated by a defensive boundary firewall or not exploitable in this subnet configuration."
            rows={3}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
          {errors.reason && <p className="mt-1 text-xs text-red-400">{errors.reason.message}</p>}
        </div>

        <div>
          <label className="text-xs text-gray-400">Business Justification</label>
          <textarea
            {...register("business_justification")}
            placeholder="e.g. Critical business migration timeline; patching now would cause unacceptable downtime during peak sales window."
            rows={3}
            className="mt-1 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          />
          {errors.business_justification && (
            <p className="mt-1 text-xs text-red-400">{errors.business_justification.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            "Submit Request"
          )}
        </button>

        {mutation.error && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Failed to submit request.
          </div>
        )}
      </form>
    </div>
  );
}
