"use client";

import React, { useState } from "react";
import { FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Clock, Download } from "lucide-react";
import { useImports, useImportErrors } from "../hooks";

export function ImportHistoryTable() {
  const { data: imports, isLoading } = useImports();
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const { data: errorList } = useImportErrors(selectedImportId);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          File Ingestion History
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Review batch import completion statuses, correlated duplicate counts, and validation results.
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-xl bg-slate-800/40 animate-pulse border border-slate-800" />
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-850/80 text-xs font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valid / Total</th>
                <th className="px-4 py-3">Correlated Duplicates</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3 text-right">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {(imports || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No previous file imports found.
                  </td>
                </tr>
              ) : (
                imports?.map((imp) => (
                  <tr key={imp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100">{imp.filename}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono">
                        {imp.import_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          imp.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : imp.status === "PREVIEWED"
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {imp.status === "COMPLETED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : imp.status === "PREVIEWED" ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {imp.valid_rows} / {imp.total_rows}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-sky-400">{imp.duplicate_rows}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(imp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {imp.invalid_rows > 0 ? (
                        <button
                          onClick={() => setSelectedImportId(imp.id)}
                          className="text-xs font-medium text-rose-400 hover:text-rose-300 underline"
                        >
                          View ({imp.invalid_rows})
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">None</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Error modal */}
      {selectedImportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4">
            <h4 className="text-base font-semibold text-slate-100">Row-Level Ingestion Errors</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(errorList || []).map((err, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <span className="text-rose-400 font-semibold font-mono block">Row {err.row_number}</span>
                  <p className="text-slate-300 mt-1">{err.error}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedImportId(null)}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
