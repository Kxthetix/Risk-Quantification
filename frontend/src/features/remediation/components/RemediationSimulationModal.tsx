import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSimulateRemediation } from "../hooks";
import { formatCurrency } from "@/lib/utils/currency";
import { TrendingDown, DollarSign, GitBranch, ArrowRight, ShieldCheck } from "lucide-react";

interface RemediationSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  remediationId: string | null;
}

export function RemediationSimulationModal({
  isOpen,
  onClose,
  remediationId,
}: RemediationSimulationModalProps) {
  const simulateMutation = useSimulateRemediation();

  useEffect(() => {
    if (isOpen && remediationId) {
      simulateMutation.mutate(remediationId);
    }
  }, [isOpen, remediationId]);

  const sim = simulateMutation.data;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            Remediation Impact &amp; ROSI Simulation
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Pre- vs. Post-mitigation empirical risk reduction, residual loss exposure, and 3-Year Total Cost of Ownership.
          </DialogDescription>
        </DialogHeader>

        {simulateMutation.isPending ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Calculating residual risk distributions &amp; ROSI metrics...
          </div>
        ) : sim ? (
          <div className="space-y-4 py-2 text-xs">
            <div className="rounded-lg bg-muted/40 p-3 border border-border">
              <span className="font-semibold text-foreground">{sim.title}</span>
              {sim.breaks_attack_paths_count > 0 && (
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Breaks {sim.breaks_attack_paths_count} external attack path(s)</span>
                </div>
              )}
            </div>

            {/* Risk Score Delta */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
                <span className="text-[10px] text-rose-400 block uppercase font-sans">Current Inherent Risk</span>
                <strong className="text-lg text-rose-400">{sim.current_risk.toFixed(1)}</strong>
              </div>

              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex flex-col justify-center items-center">
                <span className="text-[10px] text-primary block uppercase font-sans">Risk Reduction Delta</span>
                <strong className="text-lg text-primary">-{sim.risk_reduction.toFixed(1)} pts</strong>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                <span className="text-[10px] text-emerald-400 block uppercase font-sans">Residual Risk Score</span>
                <strong className="text-lg text-emerald-400">{sim.residual_risk.toFixed(1)}</strong>
              </div>
            </div>

            {/* Financial Impact Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
              <div className="rounded bg-muted/30 p-2 border border-border">
                <span className="text-[9px] text-muted-foreground block font-sans">Baseline Annual Loss</span>
                <strong className="text-xs text-foreground">
                  {formatCurrency(sim.baseline_expected_loss, { currency: "INR", compact: true })}
                </strong>
              </div>
              <div className="rounded bg-muted/30 p-2 border border-border">
                <span className="text-[9px] text-amber-400 block font-sans">Estimated Cost (TCO)</span>
                <strong className="text-xs text-amber-400">
                  {formatCurrency(sim.implementation_cost, { currency: "INR", compact: true })}
                </strong>
              </div>
              <div className="rounded bg-muted/30 p-2 border border-border">
                <span className="text-[9px] text-emerald-400 block font-sans">Loss Reduction</span>
                <strong className="text-xs text-emerald-400">
                  {formatCurrency(sim.expected_loss_reduction, { currency: "INR", compact: true })}
                </strong>
              </div>
              <div className="rounded bg-muted/30 p-2 border border-border">
                <span className="text-[9px] text-primary block font-sans">Residual Expected Loss</span>
                <strong className="text-xs text-primary">
                  {formatCurrency(sim.residual_expected_loss, { currency: "INR", compact: true })}
                </strong>
              </div>
            </div>

            {/* ROSI & TCO Highlight */}
            <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/30 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Return on Security Investment (ROSI)</span>
                <h4 className="text-2xl font-black text-emerald-400 font-mono">
                  {sim.roi.toFixed(1)}%
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">3-Year Total Cost of Ownership</span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {formatCurrency(sim.tco_3year, { currency: "INR", compact: true })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No simulation data available.
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
