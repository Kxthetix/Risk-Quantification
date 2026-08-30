import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExecutiveInvestmentSummary } from "../hooks";
import { formatCurrency } from "@/lib/utils/currency";
import { FileText, Printer, CheckCircle, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

interface ExecutiveInvestmentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveInvestmentReportModal({
  isOpen,
  onClose,
}: ExecutiveInvestmentReportModalProps) {
  const { data: summary, isLoading } = useExecutiveInvestmentSummary();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-foreground">
                  Board Cybersecurity Investment &amp; ROSI Briefing
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Audit-ready executive defense portfolio justification &amp; capital allocation report.
                </DialogDescription>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Generating Board Briefing...
          </div>
        ) : summary ? (
          <div className="space-y-6 py-3 text-xs">
            {/* Executive Headline Callout */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                Executive Strategy Brief
              </span>
              <h3 className="text-base font-bold text-foreground mt-1">
                {summary.executive_headline}
              </h3>
              <p className="text-muted-foreground mt-1.5 leading-relaxed">
                {summary.strategic_recommendation}
              </p>
            </div>

            {/* Core Financial Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground block font-sans">Current Inherent Loss</span>
                <span className="text-sm font-bold text-rose-400">
                  {formatCurrency(summary.current_annual_loss_exposure, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground block font-sans">Recommended Budget</span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(summary.recommended_budget, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-sans">Projected Loss Reduction</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(summary.projected_loss_reduction, { currency: "INR", compact: true })}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-[10px] text-primary block font-sans">Expected Portfolio ROSI</span>
                <span className="text-sm font-bold text-primary">
                  +{summary.portfolio_rosi_percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Action Priorities Breakdown */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Investment Execution Priorities
              </h4>
              <div className="grid grid-cols-3 gap-3 font-mono text-center">
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-lg font-bold text-rose-400 block">
                    {summary.action_priority.immediate_chokepoint_fixes}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    Critical Chokepoint Fixes
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-lg font-bold text-primary block">
                    {summary.action_priority.strategic_control_investments}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    Strategic Defensive Controls
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="text-lg font-bold text-emerald-400 block">
                    {summary.action_priority.quick_wins}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    Fast-Win / Low Cost Actions
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Briefing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
