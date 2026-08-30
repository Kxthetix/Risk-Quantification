"use client";

import React, { useState } from "react";
import { X, UploadCloud, CheckCircle } from "lucide-react";
import { EvidenceUploadData } from "../schemas";

interface EvidenceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EvidenceUploadData) => void;
}

export function EvidenceUploadModal({ isOpen, onClose, onSubmit }: EvidenceUploadModalProps) {
  const [formData, setFormData] = useState<EvidenceUploadData>({
    title: "",
    description: "",
    control_id: "ctrl-a8-20",
    evidence_type: "Configuration",
    expiration_date: "",
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
          <h3 className="text-base font-bold text-white">Upload Compliance Evidence</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Evidence Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. AWS Production Security Group Rules v3"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Mapped Control Code</label>
            <input
              type="text"
              required
              value={formData.control_id}
              onChange={(e) => setFormData({ ...formData, control_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="e.g. A.8.20"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Artifact Type</label>
            <select
              value={formData.evidence_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  evidence_type: e.target.value as EvidenceUploadData["evidence_type"],
                })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="Policy">Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Screenshot">Screenshot</option>
              <option value="Configuration">Configuration</option>
              <option value="Log">Log</option>
              <option value="Audit Report">Audit Report</option>
              <option value="Certificate">Certificate</option>
            </select>
          </div>

          <div className="p-4 border-2 border-dashed border-slate-700 rounded-xl text-center bg-slate-800/40">
            <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <span className="text-slate-300 font-medium">Drag & drop files or click to browse</span>
            <div className="text-[11px] text-slate-500 mt-1">PDF, JSON, PNG, CSV up to 25MB</div>
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
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Upload & Verify
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
