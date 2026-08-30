"use client";

import React, { useState } from "react";
import { useGenerateExecutiveReport } from "../hooks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/FormField";
import { FileText, Download, CheckCircle2, FileSpreadsheet, FileCode } from "lucide-react";

export interface GenerateReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period?: string;
}

export function GenerateReportModal({ open, onOpenChange, period = "30d" }: GenerateReportModalProps) {
  const [reportType, setReportType] = useState("EXECUTIVE_RISK");
  const [format, setFormat] = useState<"PDF" | "CSV" | "JSON">("PDF");
  const [reportTitle, setReportTitle] = useState("Executive Board Cybersecurity & Financial Impact Report");
  const [generatedJob, setGeneratedJob] = useState<{ id: string } | null>(null);

  const generateMutation = useGenerateExecutiveReport();

  const handleGenerate = async () => {
    try {
      const job = await generateMutation.mutateAsync({
        title: reportTitle,
        report_type: reportType,
        format,
        period,
      });
      setGeneratedJob(job);
    } catch {
      // Handled in mutation
    }
  };

  const handleClose = () => {
    setGeneratedJob(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <FileText className="h-5 w-5" />
            <DialogTitle>Generate Executive Risk Report</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Compile board-ready risk summaries, Monte Carlo financial projections, and compliance evidence into a downloadable document.
          </DialogDescription>
        </DialogHeader>

        {generatedJob ? (
          <div className="space-y-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Report Compiled Successfully</h4>
              <p className="text-xs text-muted-foreground">
                Artifact compiled in <strong className="font-mono">{format}</strong> format.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button asChild size="sm" className="w-full gap-2">
                <a href={`/api/v1/reports/${generatedJob.id}/download`} download>
                  <Download className="h-4 w-4" />
                  <span>Download Report</span>
                </a>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            <FormField label="Report Scope">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="EXECUTIVE_RISK" className="bg-popover text-popover-foreground">
                  Executive Board Cybersecurity Overview (12-Section Brief)
                </option>
                <option value="FINANCIAL_IMPACT" className="bg-popover text-popover-foreground">
                  Financial Exposure & Monte Carlo Loss Distribution
                </option>
                <option value="ATTACK_SURFACE" className="bg-popover text-popover-foreground">
                  Attack Surface & Lateral Path Analysis
                </option>
                <option value="COMPLIANCE_AUDIT" className="bg-popover text-popover-foreground">
                  Regulatory Compliance & Controls Ledger
                </option>
              </select>
            </FormField>

            <FormField label="Export Format">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "PDF", label: "PDF Document", icon: <FileText className="h-4 w-4 text-rose-500" /> },
                  { id: "CSV", label: "CSV Dataset", icon: <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> },
                  { id: "JSON", label: "Raw JSON", icon: <FileCode className="h-4 w-4 text-blue-500" /> },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id as any)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                      format === fmt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    {fmt.icon}
                    <span className="text-[11px] font-semibold text-foreground mt-1">{fmt.id}</span>
                  </button>
                ))}
              </div>
            </FormField>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={generateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                isLoading={generateMutation.isPending}
              >
                Compile Report
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
