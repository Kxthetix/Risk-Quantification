"use client";

import React, { useState } from "react";
import { X, FileText, Download, CheckCircle, ShieldCheck } from "lucide-react";
import { ComplianceSummary, FrameworkItem } from "../types";
import { formatCurrencyINR } from "@/lib/utils/formatters";

interface ExecutiveComplianceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary?: ComplianceSummary;
  frameworks?: FrameworkItem[];
}

export function ExecutiveComplianceReportModal({
  isOpen,
  onClose,
  summary,
  frameworks = [],
}: ExecutiveComplianceReportModalProps) {
  const [reportFormat, setReportFormat] = useState<"PDF" | "CSV" | "JSON">("PDF");
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Generate Executive Compliance Report</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Overall Compliance:</span>
            <span className="font-bold text-emerald-400">{summary?.overall_compliance_pct.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Total Controls Covered:</span>
            <span className="font-bold text-white">{summary?.implemented_controls_count} / {summary?.total_controls}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Financial Exposure:</span>
            <span className="font-bold text-rose-400">{formatCurrencyINR(summary?.total_compliance_risk_exposure || 0)}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <label className="block text-slate-300 font-semibold">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(["PDF", "CSV", "JSON"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setReportFormat(fmt)}
                className={`py-2 rounded-lg font-bold border transition-colors ${
                  reportFormat === fmt
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Exported Successfully
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {isExporting ? "Generating..." : `Download ${reportFormat}`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
