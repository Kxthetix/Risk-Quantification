"use client";

import React, { useState } from "react";
import { X, CheckCircle, ShieldAlert } from "lucide-react";
import { AssessmentFormData, AssessmentFormSchema } from "../schemas";

interface AssessmentWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AssessmentFormData) => void;
}

export function AssessmentWorkflowModal({ isOpen, onClose, onSubmit }: AssessmentWorkflowModalProps) {
  const [formData, setFormData] = useState<AssessmentFormData>({
    framework_id: "iso-27001-2022",
    control_id: "ctrl-a8-20",
    effectiveness_score: 85,
    finding: "",
    recommendation: "",
    status: "Draft",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Record Control Assessment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Framework</label>
            <select
              value={formData.framework_id}
              onChange={(e) => setFormData({ ...formData, framework_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="iso-27001-2022">ISO/IEC 27001:2022</option>
              <option value="nist-csf-2">NIST CSF 2.0</option>
              <option value="soc-2-type-2">SOC 2 Type II</option>
              <option value="pci-dss-4">PCI DSS 4.0</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Security Control Code</label>
            <input
              type="text"
              value={formData.control_id}
              onChange={(e) => setFormData({ ...formData, control_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. A.8.20"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Assessed Effectiveness Score (0 - 100%): <span className="text-emerald-400">{formData.effectiveness_score}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.effectiveness_score}
              onChange={(e) => setFormData({ ...formData, effectiveness_score: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Finding & Test Results</label>
            <textarea
              rows={3}
              value={formData.finding}
              onChange={(e) => setFormData({ ...formData, finding: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="Observed control behavior or deficiencies during evaluation..."
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Recommendation</label>
            <textarea
              rows={2}
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="Suggested remediation or configuration change..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Save Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
