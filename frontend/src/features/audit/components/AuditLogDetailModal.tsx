"use client";

import React from "react";
import { X, ShieldCheck, Clock, User, HardDrive, Terminal } from "lucide-react";
import { useAuditLogDetail } from "../hooks";

export function AuditLogDetailModal({
  eventId,
  onClose,
}: {
  eventId: string | null;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useAuditLogDetail(eventId);

  if (!eventId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Audit Forensics Record
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse" />
        ) : detail ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-850/60 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-500 block">Event ID</span>
                <span className="font-mono text-xs text-slate-300">{detail.id}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Timestamp</span>
                <span className="text-slate-300">{new Date(detail.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Actor</span>
                <span className="text-slate-300">{detail.user_email || detail.user_id}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Action</span>
                <span className="font-mono text-xs text-indigo-400">{detail.action}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Resource</span>
                <span className="text-slate-300">
                  {detail.resource_type} ({detail.resource_id || "N/A"})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Result</span>
                <span className="text-emerald-400 font-medium">{detail.result}</span>
              </div>
            </div>

            {/* Before / After States */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                State Diff / Context (Sensitive Data Masked)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Before State</span>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(detail.before_state || {}, null, 2)}
                  </pre>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <span className="text-xs font-medium text-slate-500 block mb-1">After State</span>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto">
                    {JSON.stringify(detail.after_state || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {detail.metadata && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Request Metadata</h4>
                <pre className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-400">Record not found.</p>
        )}
      </div>
    </div>
  );
}
