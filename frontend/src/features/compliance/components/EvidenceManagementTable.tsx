"use client";

import React from "react";
import { EvidenceItem } from "../types";
import { FileCheck, FileText, CheckCircle2, Clock, AlertCircle, UploadCloud, ShieldCheck } from "lucide-react";

interface EvidenceManagementTableProps {
  evidence?: EvidenceItem[];
  isLoading?: boolean;
  onOpenUpload?: () => void;
}

export function EvidenceManagementTable({ evidence = [], isLoading, onOpenUpload }: EvidenceManagementTableProps) {
  if (isLoading) {
    return <div className="h-64 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />;
  }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden backdrop-blur-md">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            Compliance Evidence Artifacts
          </h3>
          <p className="text-xs text-slate-400">
            Empirical configuration exports, audit reports, policies, and system logs
          </p>
        </div>
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Evidence
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/40 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Artifact Title</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Control</th>
              <th className="py-3 px-4">Uploaded By</th>
              <th className="py-3 px-4">Expiration</th>
              <th className="py-3 px-4">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {evidence.map((evi) => {
              const isVerified = evi.verification_status === "Verified";
              const isExpiring = evi.expiration_status === "Expiring Soon";
              return (
                <tr key={evi.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      {evi.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{evi.file_name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {evi.evidence_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-cyan-400">{evi.control_code}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{evi.uploaded_by}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        isExpiring ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {isExpiring ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {evi.expiration_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                        isVerified
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {evi.verification_status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
